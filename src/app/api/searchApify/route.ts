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
