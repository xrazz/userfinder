import axios from 'axios';
import * as cheerio from 'cheerio';

// Add viewable document types constant
const VIEWABLE_TYPES = [
  'pdf',
  'doc', 'docx',
  'xls', 'xlsx',
  'ppt', 'pptx'
];

// Update the content cleaning section
const cleanContent = ($) => {
  // Remove unnecessary elements
  $('script, style, iframe, noscript, nav, footer, header, .nav, .menu, .sidebar, .advertisement').remove();
  
  // Clean up the content structure
  $('h1').addClass('text-3xl font-bold mb-6 mt-8');
  $('h2').addClass('text-2xl font-bold mb-4 mt-6');
  $('h3').addClass('text-xl font-bold mb-3 mt-5');
  $('p').addClass('mb-4 leading-relaxed');
  $('ul, ol').addClass('mb-4 pl-6 space-y-2');
  $('li').addClass('leading-relaxed');
  $('a').addClass('text-blue-600 hover:underline');
  
  // Add proper spacing
  $('section, article').addClass('mb-8');
  
  // Format tables
  $('table').addClass('w-full border-collapse mb-6');
  $('th, td').addClass('border p-2');
  
  // Format blockquotes
  $('blockquote').addClass('border-l-4 border-gray-300 pl-4 italic my-4');
  
  return $;
};

// Update document template function
const documentTemplate = (url, type) => {
  // Get file extension
  const extension = url.split('.').pop()?.toLowerCase();

  // If it's a viewable document type
  if (VIEWABLE_TYPES.includes(extension)) {
    const iframeSrc = extension === 'pdf' 
      ? url 
      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    
    const fallbackText = {
      pdf: 'PDFs',
      doc: 'document',
      docx: 'document',
      xls: 'spreadsheet',
      xlsx: 'spreadsheet',
      ppt: 'presentation',
      pptx: 'presentation'
    }[extension] || 'document';

    return `
      <div class="relative w-full h-[calc(100vh-8rem)]">
        <iframe 
          src="${iframeSrc}"
          class="absolute inset-0 w-full h-full border-0"
          type="${extension === 'pdf' ? 'application/pdf' : ''}"
        >
          <p>Unable to display ${fallbackText}. 
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
              Open in new tab
            </a>
          </p>
        </iframe>
      </div>`;
  }

  // For non-viewable types, return download-only view
  return `
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <p class="mb-4">This file type can only be downloaded.</p>
      <a 
        href="${url}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <span class="mr-2">Download File</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
    </div>`;
};

// Update the extractMainContent function
const extractMainContent = ($, url) => {
  // Check if content appears to be a document
  const extension = url.split('.').pop()?.toLowerCase();
  const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'xml', 'sql'];
  
  if (documentTypes.includes(extension) || $.html().includes('%PDF-')) {
    return {
      title: `${extension.toUpperCase()} Document`,
      content: documentTemplate(url, extension),
      description: `${extension.toUpperCase()} document viewer`,
      lastModified: new Date().toISOString(),
      isDocument: true,
      documentType: extension,
      isViewable: VIEWABLE_TYPES.includes(extension)
    };
  }

  // Existing content extraction logic
  const articleSelectors = [
    'article',
    '[role="main"]',
    '.post-content', 
    '.article-content',
    '.entry-content',
    '.content',
    'main',
    '#main-content'
  ];

  let $content;
  
  // Find the main content container
  for (const selector of articleSelectors) {
    $content = $(selector).first();
    if ($content.length) break;
  }

  if (!$content?.length) {
    $content = $('body');
  }

  // Extract images
  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt');
    if (src && !src.includes('data:image') && !src.includes('base64')) {
      // Convert relative URLs to absolute
      const absoluteSrc = src.startsWith('http') ? src : new URL(src, url).href;
      images.push({
        src: absoluteSrc,
        alt: alt || ''
      });
    }
  });

  // Clean the content
  $ = cleanContent($);
  
  return {
    title: $('h1').first().text() || $('title').text(),
    content: $content.html(),
    description: $('meta[name="description"]').attr('content') || '',
    lastModified: $('meta[name="last-modified"]').attr('content') || new Date().toISOString(),
    images: images
  };
};

// Update the POST handler
export const POST = async (req, res) => {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    const extension = url.split('.').pop()?.toLowerCase();
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'xml', 'sql'];
    
    if (documentTypes.includes(extension)) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            title: `${extension.toUpperCase()} Document`,
            description: `${extension.toUpperCase()} document viewer`,
            mainContent: documentTemplate(url, extension),
            lastModified: new Date().toISOString(),
            url,
            isDocument: true,
            documentType: extension,
            isViewable: VIEWABLE_TYPES.includes(extension)
          }
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For non-PDFs, proceed with normal scraping
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const { title, content, description, lastModified, isPdf } = extractMainContent($, url);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          title,
          description,
          mainContent: content,
          lastModified,
          url,
          isPdf
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to scrape the page',
        details: error.message
      }),
      { status: 500 }
    );
  }
};