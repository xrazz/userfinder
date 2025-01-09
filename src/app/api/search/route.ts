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
  return html.replace(/<[^>]*>/g, '');
}

// Google Search function
async function googleSearch(query: string, start: number = 0): Promise<FormattedSearchResult[]> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000 // Add timeout for Google search
    });

    const $ = cheerio.load(response.data);
    const results: FormattedSearchResult[] = [];

    // Extract search results
    $('.g').each((_, element) => {
      const titleElement = $(element).find('h3').first();
      const linkElement = $(element).find('a').first();
      const snippetElement = $(element).find('.VwiC3b').first();

      const title = titleElement.text();
      const link = linkElement.attr('href');
      const snippet = snippetElement.text();

      if (title && link && link.startsWith('http')) {
        results.push({
          title: stripHtmlTags(title),
          link,
          snippet: stripHtmlTags(snippet || '')
        });
      }
    });

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

// Brave Search function
async function braveSearch(query: string, offset: number = 0): Promise<FormattedSearchResult[]> {
  try {
    const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
    if (!BRAVE_API_KEY) {
      console.warn('Brave Search API key not configured, skipping Brave results');
      return [];
    }

    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        q: query,
        offset: offset * 10,
        count: 10,
        search_lang: 'en',
        safesearch: 'moderate'
      }
    });

    if (!response.data?.web?.results) {
      return [];
    }

    return response.data.web.results.map((result: any) => ({
      title: stripHtmlTags(result.title),
      link: result.url,
      snippet: stripHtmlTags(result.description || ''),
      media: result.thumbnail ? { type: 'image', url: result.thumbnail.src } : undefined,
      source: 'brave' as const
    }));
  } catch (error) {
    console.error('Error in Brave search:', error);
    return [];
  }
}

// Combined search function
async function combinedSearch(query: string, start: number = 0): Promise<FormattedSearchResult[]> {
  try {
    // Run both searches in parallel
    const [googleResults, braveResults] = await Promise.all([
      googleSearch(query, start).catch(error => {
        console.error('Google search failed:', error);
        return [];
      }),
      braveSearch(query, start).catch(error => {
        console.error('Brave search failed:', error);
        return [];
      })
    ]);

    // Add source information to Google results
    const googleResultsWithSource = googleResults.map(result => ({
      ...result,
      source: 'google' as const
    }));

    // Merge results using a relevance-based algorithm
    const mergedResults = mergeSearchResults(googleResultsWithSource, braveResults);

    return mergedResults;
  } catch (error) {
    console.error('Error in combined search:', error);
    throw error;
  }
}

// Helper function to merge and deduplicate results
function mergeSearchResults(googleResults: FormattedSearchResult[], braveResults: FormattedSearchResult[]): FormattedSearchResult[] {
  // Create a Map to track unique URLs
  const uniqueResults = new Map<string, FormattedSearchResult>();
  
  // Helper function to normalize URLs for comparison
  const normalizeUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  };

  // Process Google results first (they get priority for duplicates)
  googleResults.forEach(result => {
    const normalizedUrl = normalizeUrl(result.link);
    uniqueResults.set(normalizedUrl, result);
  });

  // Add Brave results if they're not duplicates
  braveResults.forEach(result => {
    const normalizedUrl = normalizeUrl(result.link);
    if (!uniqueResults.has(normalizedUrl)) {
      uniqueResults.set(normalizedUrl, result);
    }
  });

  // Convert back to array and sort by relevance
  const mergedResults = Array.from(uniqueResults.values());

  // Sort results - prioritize results with media and longer snippets
  return mergedResults.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a);
    const scoreB = calculateRelevanceScore(b);
    return scoreB - scoreA;
  });
}

// Helper function to calculate result relevance score
function calculateRelevanceScore(result: FormattedSearchResult): number {
  let score = 0;
  
  // Prefer results with media
  if (result.media) {
    score += 2;
  }

  // Prefer results with longer, more informative snippets
  if (result.snippet) {
    score += Math.min(result.snippet.length / 100, 3); // Cap at 3 points
  }

  // Slightly prefer Google results as they tend to be more relevant
  if (result.source === 'google') {
    score += 1;
  }

  return score;
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
    
    const resultPromise = combinedSearch(query, start);
    
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
