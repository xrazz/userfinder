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

// Add interface for Google Search result
interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

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
  source?: 'google' | 'brave';
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

// Helper function to strip HTML tags
function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&quot;/g, '"') // Replace HTML entities
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Google Search function
async function googleSearch(query: string, start: number = 0): Promise<FormattedSearchResult[]> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
    console.log('Searching Google with URL:', searchUrl);
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 5000 // Add timeout for Google search
    });

    console.log('Got response from Google');
    
    // Check if the response contains search results
    if (!response.data.includes('class="g"')) {
      console.log('No search results found in response HTML');
      console.log('Response preview:', response.data.substring(0, 500));
      throw new Error('No search results found in response');
    }

    const $ = cheerio.load(response.data);
    const results: FormattedSearchResult[] = [];

    // Extract search results - updated selector and added more variations
    $('div.g:not(.g-blk), div[data-hveid]').each((_, element) => {
      const titleElement = $(element).find('h3, a > h3').first();
      const linkElement = $(element).find('a[href^="http"]').first();
      const snippetElement = $(element).find('div.VwiC3b, div.IsZvec, div[data-content-feature="1"]').first();

      const title = titleElement.text();
      const link = linkElement.attr('href');
      const snippet = snippetElement.text();

      console.log('Found result:', { title, link, snippet: snippet?.substring(0, 50) });

      if (title && link && link.startsWith('http')) {
        results.push({
          title: stripHtmlTags(title),
          link,
          snippet: stripHtmlTags(snippet || '')
        });
      }
    });

    console.log(`Found ${results.length} results`);

    if (results.length === 0) {
      throw new Error('No valid results found after parsing');
    }

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
    console.error('Error in Google search:', error);
    throw error;
  }
}

// Add Brave Search function
async function braveSearch(query: string, start: number = 0): Promise<FormattedSearchResult[]> {
  try {
    const offset = start;
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || ''
      },
      params: {
        q: query,
        offset: offset,
        count: 10
      }
    });

    const results = (response.data.web?.results || []) as BraveSearchResult[];
    
    // Format Brave results to match our interface
    const formattedResults: FormattedSearchResult[] = results.map(result => ({
      title: result.title,
      link: result.url,
      snippet: result.description,
      source: 'brave' as const
    }));

    // Process media content in parallel with a limited concurrency of 3
    const resultsWithMedia = await Promise.all(
      formattedResults.map(async (result, index) => {
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

// Combined search function
async function combinedSearch(query: string, start: number = 0): Promise<FormattedSearchResult[]> {
  try {
    console.log('Starting combined search for query:', query);
    // Try Google search first
    try {
      console.log('Attempting Google search...');
      const googleResults = await googleSearch(query, start);
      if (googleResults.length > 0) {
        console.log(`Google search returned ${googleResults.length} results`);
        return googleResults.map(result => ({
          ...result,
          source: 'google' as const
        }));
      }
      // If Google returns no results or fails, try Brave
      console.log('No Google results, falling back to Brave...');
      const braveResults = await braveSearch(query, start);
      return braveResults;
    } catch (error: any) {
      console.error('Google search error:', error.message);
      // If Google fails, try Brave as fallback
      console.log('Google search failed, falling back to Brave...');
      return await braveSearch(query, start);
    }
  } catch (error) {
    console.error('Error in combined search:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { query, start = 0 } = await req.json();
    console.log('Received search request:', { query, start });
    
    if (!query) {
      console.log('Query is empty, returning 400');
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Set a shorter timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), 15000)
    );
    
    const resultPromise = combinedSearch(query, start);
    
    const result = await Promise.race([resultPromise, timeoutPromise]) as FormattedSearchResult[];
    console.log(`Search completed successfully with ${result.length} results`);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Search API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
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
