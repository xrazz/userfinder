import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: process.env.MY_API_KEY,
});

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

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
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
    console.log(`Failed to extract media for ${url}:`, error);
    return undefined;
  }
}

/**
 * Run an Apify actor with the provided query and num.
 * @param site - The search query to be used in the actor.
 * @param query - The search query to be used in the actor.
 * @param num - The number of items to fetch.
 * @returns A promise that resolves to the items fetched from the actor's dataset.
 */
async function runApifyActor(query: string, numSearches: number): Promise<any[]> {
  // Prepare Actor input
  console.log('Running actor with query:', query, 'and num:', numSearches);
  const input = { query, numSearches};

  try {
    // Run the Actor and wait for it to finish
    const run = await client.actor("cgA5zIbA9F9JT5Jkk").call(input);

    // Fetch and return Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    // Add media content to results
    const itemsWithMedia = await Promise.all(items.map(async (item: any) => {
      const media = await extractThumbnail(item.link as string);
      return {
        ...item,
        media
      };
    }));

    return itemsWithMedia;
  } catch (error) {
    console.error('Error running the actor:', error);
    throw error;
  }
}

/**
 * POST API route handler for running the Apify actor.
 * Accepts a search query and a number as input, returning the fetched items.
 * 
 * @param req - Incoming request object.
 */
export async function POST(req: Request) {
  try {
    const { query, num } = await req.json(); // Extract query and num from the request body
    
    // Run the Apify actor with the provided query and num
    const result = await runApifyActor(query, num);

    // Return the fetched items as JSON
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    // Handle any errors and return an error response
    console.error('Search API error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
