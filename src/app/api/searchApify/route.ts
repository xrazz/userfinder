import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: 'apify_api_f8Nb5S1SPM0QexOpBotE5vmht7ewgi2Lsa06',
});

/**
 * Run an Apify actor with the provided query.
 * @param query - The search query to be used in the actor.
 * @returns A promise that resolves to the items fetched from the actor's dataset.
 */
async function runApifyActor(query: string): Promise<any[]> {
  // Prepare Actor input
  console.log('here im printing query',query)
  const input: { query: string } = {
    query: query,
  };

  try {
    // Run the Actor and wait for it to finish
    const run = await client.actor("9CKODJmHV3NSz5zLC").call(input);

    // Fetch and return Actor results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(items)
    return items; // Return the items fetched
  } catch (error) {
    console.error('Error running the actor:', error);
    throw error; // Re-throw the error to handle it in the calling context
  }
}

/**
 * POST API route handler for running the Apify actor.
 * Accepts a search query as input and returns the fetched items.
 * 
 * @param req - Incoming request object.
 */
export async function POST(req: Request) {
  try {
    const { query } = await req.json(); // Extract the search query from the request body

    // Run the Apify actor with the provided query
    const result = await runApifyActor(query);

    // Return the fetched items as JSON
    return NextResponse.json({ success: true, data: result });
  } catch (error:any) {
    // Handle any errors and return an error response
    return NextResponse.json({ success: false, error: error.message });
  }
}
