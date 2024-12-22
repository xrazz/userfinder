import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

interface SearchResult {
    title: string;
    snippet: string;
    link: string;
}

const MAX_RESULTS = 50; // Numero massimo di risultati consentiti
const GOOGLE_BASE_URL = 'https://www.google.com/search';

export async function POST(request: Request) {
    try {
        // Parse the request body
        const body = await request.json();
        const { query, num, start } = body;

        // Validazione dei parametri
        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Invalid query parameter. It must be a non-empty string.' },
                { status: 400 }
            );
        }
        if (!num || num < 1 || num > MAX_RESULTS) {
            return NextResponse.json(
                { success: false, error: `Invalid "num" parameter. It must be between 1 and ${MAX_RESULTS}.` },
                { status: 400 }
            );
        }

        // Costruzione dell'URL della ricerca Google
        const url = `${GOOGLE_BASE_URL}?q=${encodeURIComponent(query)}&start=${start || 0}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        };

        // Esecuzione della richiesta HTTP
        const { data } = await axios.get(url, { headers, timeout: 5000 });
        const $ = cheerio.load(data);

        // Parsing dei risultati
        const results: SearchResult[] = [];
        $('div.g').each((_, el) => {
            const title = $(el).find('h3').text().trim();
            const snippet = $(el).find('.VwiC3b').text().trim();
            const link = $(el).find('a').attr('href');

            if (title && link) {
                results.push({ title, snippet, link });
            }
        });

        // Risultato JSON
        return NextResponse.json({ success: true, data: results });
    } catch (error: any) {
        console.error('Error in API route:', error.message || error);

        // Risposta di errore
        return NextResponse.json(
            { success: false, error: 'Failed to fetch search results.', details: error.message || null },
            { status: 500 }
        );
    }
}
