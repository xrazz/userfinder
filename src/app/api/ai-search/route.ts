import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "@langchain/core/documents"
import axios from 'axios'

// Set runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 20; // 20 seconds timeout

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Cache for vector stores
const vectorStoreCache = new Map<string, MemoryVectorStore>()

// Add this helper function to clean and structure the HTML
function structureResponse(content: string): string {
    // Clean up markdown formatting and HTML tags
    content = content
        // Convert **text** to <strong>text</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *text* to <strong>text</strong>
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        // Remove <br> tags and replace with space
        .replace(/<br>/g, ' ')
        // Clean up any stray asterisks
        .replace(/\*/g, '')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove empty lines
        .replace(/^\s*[\r\n]/gm, '')
    
    // Split into sections and format
    const sections = content.split('\n\n')
    return `<div class="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        ${sections.map(section => {
            if (section.includes(':')) {
                const [title, ...rest] = section.split(':')
                return `<div class="space-y-3">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        ${getIconForSection(title)}
                        ${title.trim()}
                    </h3>
                    <div class="pl-6 space-y-3">
                        ${formatContent(rest.join(':').trim())}
                    </div>
                </div>`
            }
            return `<div class="prose dark:prose-invert max-w-none">
                ${formatContent(section)}
            </div>`
        }).join('\n')}
    </div>`
}

// Helper function to get icons for sections
function getIconForSection(title: string): string {
    const icons: Record<string, string> = {
        'Key Points': '<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        'Details': '<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        'Summary': '<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>'
    }
    return icons[title.trim()] || ''
}

// Helper function to format content within sections
function formatContent(content: string): string {
    // Handle bullet points
    if (content.includes('•')) {
        const points = content.split('•').filter(p => p.trim())
        return `<ul class="space-y-3">
            ${points.map(point => {
                const cleanedPoint = point.trim()
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                    .replace(/<br>/g, ' ')
                    .replace(/\*/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                
                return `<li class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span class="text-primary mt-1">•</span>
                    <span class="flex-1 text-gray-700 dark:text-gray-300">${cleanedPoint}</span>
                </li>`
            }).join('\n')}
        </ul>`
    }
    
    // Handle regular paragraphs
    const cleanedContent = content.trim()
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/<br>/g, ' ')
        .replace(/\*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    
    return `<p class="text-gray-700 dark:text-gray-300 leading-relaxed">${cleanedContent}</p>`
}

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json()

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            )
        }

        // First get regular search results
        const searchResponse = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                num: 5, // Limit to top 5 results for AI analysis
            }),
        })

        const searchData = await searchResponse.json()
        const searchResults = searchData.data || []

        // Try to scrape full content for each result
        const contentPromises = searchResults.map(async (result: any) => {
            try {
                const response = await axios.post('/api/scrape', {
                    url: result.link
                })
                
                return {
                    url: result.link,
                    content: response.data.summary?.mainContent || result.snippet,
                    isFullContent: !!response.data.summary?.mainContent
                }
            } catch (error) {
                console.log(`Failed to scrape ${result.link}, falling back to snippet`)
                return {
                    url: result.link,
                    content: result.snippet,
                    isFullContent: false
                }
            }
        })

        const contents = await Promise.all(contentPromises)

        // Create text splitter
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        })

        // Process all contents through RAG
        let vectorStore
        const docs: Document[] = []

        for (const content of contents) {
            if (content.content) {  // Add null check
                const chunks = await textSplitter.splitText(content.content)
                docs.push(...chunks.map(chunk => 
                    new Document({ 
                        pageContent: chunk,
                        metadata: { 
                            url: content.url,
                            isFullContent: content.isFullContent 
                        }
                    })
                ))
            }
        }

        // Create vector store
        vectorStore = await MemoryVectorStore.fromDocuments(
            docs,
            new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
            })
        )

        // Perform similarity search
        const similarDocs = await vectorStore.similaritySearch(query, 5)

        // Construct context from similar documents
        const context = similarDocs.map(doc => ({
            content: doc.pageContent,
            url: doc.metadata.url,
            isFullContent: doc.metadata.isFullContent
        }))

        // Update the system prompt
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a concise search assistant. Provide brief but informative summaries. Format text without any markdown symbols.

Format your response in these short sections:

1. Key Points: (2-3 bullet points)
• Most important findings only, using plain text
• Format emphasis using complete HTML tags, never use * or **

2. Details: (2-3 bullet points)
• Essential context in plain text
• Use <strong>text</strong> for emphasis

3. Summary:
• Brief synthesis
• One key takeaway

Formatting Rules:
- Never use * or ** symbols
- For emphasis, use complete HTML tags: <strong>important text</strong>
- Citations: <a href="url" target="_blank">[1]</a>
- Use bullet points (•) for lists
- Keep each section to 2-3 points maximum
- Write in plain text, using HTML tags only when needed
- No markdown formatting allowed

Example format:
• The <strong>key concept</strong> involves several aspects <a href="url" target="_blank">[1]</a>
• Research shows significant findings about <strong>important topic</strong>`
                },
                {
                    role: "user",
                    content: `Query: ${query}\n\nContent for Analysis:\n${context.map(doc => 
                        `Source: ${doc.url}\nContent Type: ${doc.isFullContent ? 'Full Article' : 'Snippet'}\nContent: ${doc.content}`
                    ).join('\n\n')}`
                }
            ],
            temperature: 0.5,
        })

        // Structure and clean the response
        const cleanedResponse = structureResponse(completion.choices[0].message.content || '')

        return NextResponse.json({
            searchResults,
            aiSynthesis: cleanedResponse
        })

    } catch (error) {
        console.error('AI Search error:', error)
        return NextResponse.json(
            { error: 'Failed to process AI search request' },
            { status: 500 }
        )
    }
}