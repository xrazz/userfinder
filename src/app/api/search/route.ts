// import { NextResponse } from 'next/server';
// import got from 'got';
// import * as cheerio from 'cheerio';
// import { HttpProxyAgent } from 'http-proxy-agent';
// import { HttpsProxyAgent } from 'https-proxy-agent';

// interface SearchResult {
//     title: string;
//     snippet: string;
//     link: string;
// }

// const MAX_RESULTS = 50;
// const GOOGLE_BASE_URL = 'https://www.google.com/search';
// const PROXY_URL = 'http://groups-BUYPROXIES94952:apify_proxy_gCveDEOMr7RZSI9nf2sl9pdFDEjlW644qAR9@proxy.apify.com:8000';

// export async function POST(request: Request) {
//     try {
//         // Parse the request body
//         const body = await request.json();
//         const { query, num, start } = body;

//         // Log for debugging
//         console.log('API received query:', query);

//         // Validate parameters
//         if (!query || typeof query !== 'string') {
//             return NextResponse.json(
//                 { success: false, error: 'Invalid query parameter. It must be a non-empty string.' },
//                 { status: 400 }
//             );
//         }

//         if (!num || num < 1 || num > MAX_RESULTS) {
//             return NextResponse.json(
//                 { success: false, error: `Invalid "num" parameter. It must be between 1 and ${MAX_RESULTS}.` },
//                 { status: 400 }
//             );
//         }

//         // Construct Google search URL
//         const url = `${GOOGLE_BASE_URL}?q=${encodeURIComponent(query)}&start=${start || 0}`;
//         console.log('Google search URL:', url);

//         // Create proxy agents
//         const httpAgent = new HttpProxyAgent(PROXY_URL);
//         const httpsAgent = new HttpsProxyAgent(PROXY_URL);

//         // Create the got instance with proxy
//         const client = got.extend({
//             headers: {
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
//             },
//             timeout: {
//                 request: 5000,
//                 response: 5000,
//             },
//             agent: {
//                 http: httpAgent,
//                 https: httpsAgent
//             },
//             retry: {
//                 limit: 3,
//                 statusCodes: [408, 413, 429, 500, 502, 503, 504]
//             }
//         });

//         // Execute the HTTP request with got
//         const response = await client(url);

//         // Parse the results using cheerio
//         const $ = cheerio.load(response.body);
//         const results: SearchResult[] = [];

//         $('div.g').each((_, el) => {
//             const title = $(el).find('h3').text().trim();
//             const snippet = $(el).find('.VwiC3b').text().trim();
//             const link = $(el).find('a').attr('href');
//             if (title && link) {
//                 results.push({ title, snippet, link });
//             }
//         });

//         // Return JSON response
//         return NextResponse.json({ success: true, data: results });
//     } catch (error: any) {
//         console.error('Error in API route:', error.message || error);
//         // Return error response
//         return NextResponse.json(
//             { success: false, error: 'Failed to fetch search results.', details: error.message || null },
//             { status: 500 }
//         );
//     }
// }


import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify';

// Initialize the ApifyClient with API token
// console.log(process.env.MY_API_KEY)
const client = new ApifyClient({
 
  token: process.env.MY_API_KEY,
});

/**
 * Run an Apify actor with the provided query and num.
 * @param site - The search query to be used in the actor.
 * @param query - The search query to be used in the actor.
 * @param num - The number of items to fetch.
 * @returns A promise that resolves to the items fetched from the actor's dataset.
 */
async function runApifyActor(query: string, numSearches: number): Promise<any[]> {
// async function runApifyActor(query: string, num: number): Promise<any[]> {
  // Prepare Actor input
  console.log('Running actor with query:', query, 'and num:', numSearches);
  const input = { query, numSearches};
  // const input = { query, num};

  try {
    // Run the Actor and wait for it to finish
    const run = await client.actor("cgA5zIbA9F9JT5Jkk").call(input);
    // const run = await client.actor("ng1xerldzKfTBxALt").call(input);

    // Fetch and return Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(items);
    return items;
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
