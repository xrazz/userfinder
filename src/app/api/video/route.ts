import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

function extractYouTubeVideoId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            return urlObj.pathname.substring(1);
        }
        return null;
    } catch {
        return null;
    }
}

function extractVimeoId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('vimeo.com')) {
            return urlObj.pathname.split('/').pop() || null;
        }
        return null;
    } catch {
        return null;
    }
}

async function extractThumbnail(videoElement: cheerio.Cheerio, cleanLink: string): Promise<string | null> {
    try {
        // 1. First try to get direct image/video elements
        const imgElement = videoElement.find('img').first();
        const videoElement2 = videoElement.find('video').first();
        
        // Check for data-thumbnail attribute that some video platforms use
        let thumbnailUrl = videoElement.find('[data-thumbnail]').attr('data-thumbnail') ||
                          videoElement.find('[data-thumb]').attr('data-thumb');

        if (!thumbnailUrl) {
            // 2. Check standard image sources
            if (imgElement.length) {
                thumbnailUrl = imgElement.attr('src') || 
                              imgElement.attr('data-src') || 
                              imgElement.attr('data-lazy-src') ||
                              imgElement.attr('data-original');
            } else if (videoElement2.length) {
                thumbnailUrl = videoElement2.attr('poster');
            }
        }

        // 3. Handle relative URLs
        if (thumbnailUrl && thumbnailUrl.startsWith('/')) {
            thumbnailUrl = `https://www.google.com${thumbnailUrl}`;
        }

        // 4. Handle base64 images and missing thumbnails
        if (!thumbnailUrl || thumbnailUrl.startsWith('data:image')) {
            // Try platform-specific thumbnail extraction
            const youtubeId = extractYouTubeVideoId(cleanLink);
            if (youtubeId) {
                return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
            }

            const vimeoId = extractVimeoId(cleanLink);
            if (vimeoId) {
                try {
                    // Fetch Vimeo thumbnail through their oEmbed API
                    const response = await axios.get(`https://vimeo.com/api/v2/video/${vimeoId}.json`);
                    return response.data[0]?.thumbnail_large || null;
                } catch {
                    // Fallback to Vimeo's default thumbnail pattern
                    return `https://i.vimeocdn.com/video/${vimeoId}_640.jpg`;
                }
            }

            // For Dailymotion videos
            if (cleanLink.includes('dailymotion.com')) {
                const dailymotionId = cleanLink.split('/').pop()?.split('?')[0];
                if (dailymotionId) {
                    return `https://www.dailymotion.com/thumbnail/video/${dailymotionId}`;
                }
            }
        }

        // 5. Final cleanup
        if (thumbnailUrl) {
            // Ensure HTTPS
            thumbnailUrl = thumbnailUrl.replace(/^http:/, 'https:');
            
            // Remove any unsafe or tracking parameters
            try {
                const urlObj = new URL(thumbnailUrl);
                ['tracking', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(param => {
                    urlObj.searchParams.delete(param);
                });
                return urlObj.toString();
            } catch {
                return thumbnailUrl;
            }
        }

        return thumbnailUrl || null;
    } catch (error) {
        console.error('Error extracting thumbnail:', error);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { query, num } = await req.json();
        if (!query) {
            return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
        }

        const numVideos = num || 10;
        const searchQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?q=${searchQuery}&tbm=vid&hl=en`;

        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
            },
        });

        const $ = cheerio.load(response.data);
        
        const videoElements = $('div.g, div.YQ4gaf')
            .filter((_, el) => $(el).find('h3, .LC20lb').length > 0)
            .slice(0, numVideos * 2)
            .toArray();

        const seenUrls = new Set<string>();
        const seenTitles = new Set<string>();

        const videos = await Promise.all(
            videoElements.map(async (element) => {
                const videoElement = $(element);
                const title = videoElement.find('h3, .LC20lb').first().text().trim();
                const link = videoElement.find('a').first().attr('href');
                
                if (!title || !link || seenUrls.has(link) || seenTitles.has(title)) {
                    return null;
                }

                const cleanLink = link.startsWith('/url?q=') 
                    ? decodeURIComponent(link.replace('/url?q=', '').split('&')[0]) 
                    : link;

                if (seenUrls.has(cleanLink)) {
                    return null;
                }

                const description = videoElement.find('.VwiC3b, .lEBKkf').first().text().trim();
                const duration = videoElement.find('.FxLDp, .ytECDf').first().text().trim();
                const sourceInfo = videoElement.find('.NJjxre, .pcJO7e').first().text().trim();
                const [source, uploadTime] = sourceInfo.split(' - ');

                const thumbnailUrl = await extractThumbnail(videoElement, cleanLink);

                seenUrls.add(cleanLink);
                seenTitles.add(title);

                return {
                    title,
                    link: cleanLink,
                    description,
                    duration,
                    source: source || null,
                    uploadTime: uploadTime || null,
                    thumbnail: thumbnailUrl,
                };
            })
        );

        const validVideos = videos
            .filter((video): video is NonNullable<typeof video> => video !== null)
            .slice(0, numVideos);

        return NextResponse.json({ success: true, data: validVideos });
    } catch (error: any) {
        console.error('Error scraping videos:', error.message || error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}