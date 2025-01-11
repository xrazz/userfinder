import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface VideoContent {
  type: 'video';
  platform: string;
  videoId: string;
  embedUrl: string;
  thumbnailUrl?: string;
}

interface ImageContent {
  type: 'image';
  url: string;
}

type MediaContent = VideoContent | ImageContent;

// Add interface for Brave Search result
interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

// Add interface for our formatted result
interface FormattedSearchResult {
  title: string;
  link: string;
  snippet: string;
  media?: MediaContent;
  source?: 'brave';
}

// Helper function to strip HTML tags
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

// Helper function to extract video information
function extractVideoInfo(url: string): VideoContent | null {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else {
        videoId = urlObj.pathname.slice(1);
      }
      if (videoId) {
        return {
          type: 'video',
          platform: 'youtube',
          videoId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/')[1];
      if (videoId) {
        return {
          type: 'video',
          platform: 'vimeo',
          videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
        };
      }
    }
    
    // Dailymotion
    if (urlObj.hostname.includes('dailymotion.com')) {
      const videoId = urlObj.pathname.split('/')[2];
      if (videoId) {
        return {
          type: 'video',
          platform: 'dailymotion',
          videoId,
          embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
        };
      }
    }
    
    // Twitch
    if (urlObj.hostname.includes('twitch.tv')) {
      const channelName = urlObj.pathname.split('/')[1];
      if (channelName) {
        return {
          type: 'video',
          platform: 'twitch',
          videoId: channelName,
          embedUrl: `https://player.twitch.tv/?channel=${channelName}&parent=${process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}`,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting video info:', error);
    return null;
  }
}

// Helper function to extract thumbnail from HTML
async function extractThumbnail(url: string): Promise<MediaContent | undefined> {
  // First check if it's a video URL
  const videoInfo = extractVideoInfo(url);
  if (videoInfo) {
    return videoInfo;
  }

  // List of domains known to block scraping or require authentication
  const restrictedDomains = [
    'jstor.org',
    'academia.edu',
    'researchgate.net',
    'sciencedirect.com',
    'springer.com',
    'wiley.com',
    'tandfonline.com',
    'ieee.org',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com'
  ];

  // Check if URL is from a restricted domain
  const urlObj = new URL(url);
  if (restrictedDomains.some(domain => urlObj.hostname.includes(domain))) {
    return undefined;
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 3000, // Reduced timeout to 3 seconds
      maxContentLength: 500000 // Limit response size to 500KB
    });
    
    const $ = cheerio.load(data);
    
    // First try meta tags only - faster than parsing whole DOM
    const metaImage = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('meta[property="og:image:url"]').attr('content');
    
    if (metaImage && typeof metaImage === 'string') {
      const imageUrl = metaImage.startsWith('http') ? metaImage : new URL(metaImage, url).href;
      return {
        type: 'image',
        url: imageUrl
      };
    }
    
    return undefined; // Skip full image search for better performance
  } catch (error) {
    return undefined;
  }
}

// Brave Search function
async function braveSearch(query: string, start: number = 0): Promise<FormattedSearchResult[]> {
  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY
      },
      params: {
        q: query,
        offset: start,
        count: 10,
        search_lang: 'en'
      },
      timeout: 5000 // Add timeout for Brave search
    });

    const results: FormattedSearchResult[] = response.data.web.results.map((result: any) => ({
      title: stripHtmlTags(result.title),
      link: result.url,
      snippet: stripHtmlTags(result.description),
      source: 'brave' as const
    }));

    // Process media content in parallel with a limited concurrency of 3
    const resultsWithMedia = await Promise.all(
      results.map(async (result, index) => {
        // Only process first 5 results for media content
        if (index < 5) {
          try {
            const media = await extractThumbnail(result.link);
            return { ...result, media };
          } catch (error) {
            return { ...result, media: undefined };
          }
        }
        return { ...result, media: undefined };
      })
    );

    return resultsWithMedia;
  } catch (error) {
    console.error('Error in Brave search:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { query, start = 0 } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Set a shorter timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), 15000)
    );
    
    const resultPromise = braveSearch(query, start);
    
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Search API error:', error);
    
    const status = error.message === 'Operation timeout' ? 504 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred during search'
      },
      { status }
    );
  }
}
