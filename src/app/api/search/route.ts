import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

interface SearchResult {
    title: string;
    snippet: string;
    link: string;
}

export async function POST(request: Request) {
    try {
        // Parse the request body
        const body = await request.json();
        const { query, num, start } = body;

        if (!query || !num || num < 1 || num > 50) {
            return NextResponse.json(
                { success: false, error: 'Invalid parameters. Ensure "query" is provided and "num" is between 1 and 50.' },
                { status: 400 }
            );
        }

        // Construct the Google search URL
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        };

        // Fetch the search results
        const { data } = await axios.get(url, { headers, timeout: 5000 });
        const $ = cheerio.load(data);

        // Parse the results
        const results: SearchResult[] = [];
        const seenLinks = new Set<string>(); // Track seen links to avoid duplicates

        $('div.g').each((_, el) => {
            const title = $(el).find('h3').text().trim();
            const snippet = $(el).find('.VwiC3b').text().trim();
            const link = $(el).find('a').attr('href');

            // Avoid duplicates based on the link
            if (title && link && !seenLinks.has(link)) {
                results.push({ title, snippet, link });
                seenLinks.add(link); // Add to the set of seen links
            }
        });

        console.log(results);
        return NextResponse.json({ success: true, data: results });
    } catch (error: any) {
        console.error('Error in API route:', error.message || error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch search results.' },
            { status: 500 }
        );
    }
}
