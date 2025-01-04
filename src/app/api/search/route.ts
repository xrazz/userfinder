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
    'ieee.org'
  ];

  // Check if URL is from a restricted domain
  const urlObj = new URL(url);
  if (restrictedDomains.some(domain => urlObj.hostname.includes(domain))) {
    console.log(`Skipping media extraction for restricted domain: ${urlObj.hostname}`);
    return undefined;
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000 // 5 second timeout
    });
    
    const $ = cheerio.load(data);
    
    // First try meta tags
    const metaImage = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('meta[property="og:image:url"]').attr('content') || '';
    
    if (metaImage && typeof metaImage === 'string') {
      const imageUrl = metaImage.startsWith('http') ? metaImage : new URL(metaImage, url).href;
      return {
        type: 'image',
        url: imageUrl
      };
    }
    
    // Then try finding the first meaningful image
    let firstImage: string | undefined;
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const width = parseInt($(el).attr('width') || '0');
      const height = parseInt($(el).attr('height') || '0');
      
      // Skip tiny images, icons, and data URLs
      if (src && typeof src === 'string' && 
          !src.includes('logo') &&
          !src.includes('icon') &&
          !src.includes('data:image') &&
          !src.includes('base64') &&
          (width === 0 || width > 100) &&
          (height === 0 || height > 100)) {
        firstImage = src;
        return false; // break the loop
      }
    });
    
    if (firstImage) {
      const imageUrl = firstImage.startsWith('http') ? firstImage : new URL(firstImage, url).href;
      return {
        type: 'image',
        url: imageUrl
      };
    }
    
    return undefined;
  } catch (error) {
    // Log error without full stack trace for cleaner logs
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Skipping media extraction for ${url}: ${errorMessage}`);
    return undefined;
  }
}

async function googleSearch(query: string, start: number = 0): Promise<any[]> {
  try {
    // Construct the Google search URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
    
    // Make the request with a browser-like User-Agent
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results: any[] = [];

    // Parse search results
    $('.g').each((_, element) => {
      const titleElement = $(element).find('h3').first();
      const linkElement = $(element).find('a').first();
      const snippetElement = $(element).find('.VwiC3b').first();

      const title = titleElement.text();
      const link = linkElement.attr('href');
      const snippet = snippetElement.text();

      // Only add results with all required fields
      if (title && link && snippet) {
        results.push({
          title,
          link: link.startsWith('/url?q=') ? decodeURIComponent(link.substring(7).split('&')[0]) : link,
          snippet
        });
      }
    });

    // Process media content in parallel
    const resultsWithMedia = await Promise.all(
      results.map(async (result) => {
        try {
          const media = await extractThumbnail(result.link);
          return { ...result, media };
        } catch (error) {
          console.warn(`Failed to extract media for ${result.link}:`, error);
          return { ...result, media: undefined };
        }
      })
    );

    return resultsWithMedia;
  } catch (error) {
    console.error('Error in Google search:', error);
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

    // Set a timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), 30000)
    );
    
    const resultPromise = googleSearch(query, start);
    
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Search API error:', error);
    
    // Return appropriate status codes based on error type
    const status = error.message === 'Operation timeout' ? 504 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status }
    );
  }
}
