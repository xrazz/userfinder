import axios from 'axios';
import cheerio from 'cheerio';

// Define content importance hierarchy
const TAG_WEIGHTS = {
  'h1': 10,   // Most important heading
  'h2': 8,    // Section headings
  'h3': 6,    // Subsection headings
  'strong': 5, // Emphasized text
  'p': 3,     // Standard paragraphs
  'li': 2,    // List items
};

export const POST = async (req, res) => {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Semantic content extraction with weighted scoring
    const semanticContent = [];
    
    $('h1, h2, h3, p, strong, li').each((_, element) => {
      const tag = $(element).prop('tagName').toLowerCase();
      const text = $(element).text().trim();
      const weight = TAG_WEIGHTS[tag] || 1;

      if (text && text.length > 10) {  // Ignore very short text snippets
        semanticContent.push({
          tag,
          text,
          weight,
          context: getContextualInfo($(element)),
        });
      }
    });

    // Sort content by importance (weight and length)
    semanticContent.sort((a, b) => {
      const weightDiff = b.weight - a.weight;
      return weightDiff !== 0 ? weightDiff : b.text.length - a.text.length;
    });

    // Create a structured summary
    const summary = {
      title: $('title').text() || '',
      metaDescription: $('meta[name="description"]').attr('content') || '',
      mainContent: semanticContent.slice(0, 20).map(item => item.text).join(' '),
      semanticContent,
    };

    // Limit total content length
    const maxLength = 4000; // Adjust based on LLM context limits
    const truncatedContent = JSON.stringify(summary).slice(0, maxLength);

    return new Response(
      JSON.stringify({
        success: true,
        data: truncatedContent,
        summary,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to scrape the page',
        details: error.message,
      }),
      { status: 500 }
    );
  }
};

// Helper function to extract additional context
function getContextualInfo(element) {
  return {
    classes: element.attr('class') || '',
    id: element.attr('id') || '',
    previousElement: element.prev().text().trim().slice(0, 100),
    nextElement: element.next().text().trim().slice(0, 100),
  };
}