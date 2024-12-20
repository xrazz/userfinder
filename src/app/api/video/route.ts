import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

export async function POST(req: NextRequest) {
    try {
        const { query, num } = await req.json();
        if (!query) {
            return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
        }

        const numVideos = num || 10;
        const searchQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?q=${searchQuery}&tbm=vid&hl=en`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
            },
        });

        const $ = cheerio.load(response.data);
        const videoElements = $('div.g, div.YQ4gaf').slice(0, numVideos).toArray();

        // Process elements in parallel
        const videos = await Promise.all(
            videoElements.map(async (element) => {
                const videoElement = $(element);
                const title = videoElement.find('h3, .LC20lb').first().text().trim();
                const link = videoElement.find('a').first().attr('href');
                const description = videoElement.find('.VwiC3b, .lEBKkf').first().text().trim();
                const duration = videoElement.find('.FxLDp, .ytECDf').first().text().trim();
                const sourceInfo = videoElement.find('.NJjxre, .pcJO7e').first().text().trim();
                const [source, uploadTime] = sourceInfo.split(' - ');

                if (title && link) {
                    const cleanLink = link.startsWith('/url?q=') ? decodeURIComponent(link.replace('/url?q=', '').split('&')[0]) : link;

                    return {
                        title,
                        link: cleanLink,
                        description,
                        duration,
                        source: source || null,
                        uploadTime: uploadTime || null,
                    };
                }
                return null;
            })
        );

        // Filter out any null values from invalid data
        const validVideos = videos.filter((video) => video !== null);
console.log(validVideos)
        return NextResponse.json({ success: true, data: validVideos });
    } catch (error: any) {
        console.error('Error scraping videos:', error.message || error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
