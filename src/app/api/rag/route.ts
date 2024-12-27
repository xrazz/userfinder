import { NextRequest, NextResponse } from 'next/server'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "@langchain/core/documents"

// Set runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 20; // 20 seconds timeout

// Cache for vector stores
const vectorStoreCache = new Map<string, MemoryVectorStore>()

export async function POST(req: NextRequest) {
    try {
        const { content, query, url, email } = await req.json()

        if (!content || !query || !url) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if we have a cached vector store for this URL
        let vectorStore = vectorStoreCache.get(url)

        if (!vectorStore) {
            // Create text splitter
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            })

            // Split text into chunks
            const chunks = await textSplitter.splitText(content)
            
            // Convert chunks to documents
            const docs = chunks.map(
                chunk => new Document({ pageContent: chunk })
            )

            // Create and cache vector store
            vectorStore = await MemoryVectorStore.fromDocuments(
                docs,
                new OpenAIEmbeddings({
                    openAIApiKey: process.env.OPENAI_API_KEY,
                })
            )
            vectorStoreCache.set(url, vectorStore)
        }

        // Perform similarity search
        const similarDocs = await vectorStore.similaritySearch(query, 3)

        // Construct context from similar documents
        const context = similarDocs.map(doc => doc.pageContent).join('\n\n')

        // Construct the prompt
        const prompt = `Context from the document:
---
${context}
---

Based on the above context, please answer the following question:
${query}

Guidelines:
- Use only the information provided in the context
- If the context doesn't contain relevant information, say so
- Respond in a natural, conversational way
- Keep the response clear and concise
- If citing specific information, use simple inline citations`

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant that answers questions based on provided context.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
            }),
        })

        const data = await response.json()

        return NextResponse.json({
            output: data.choices[0].message.content
        })

    } catch (error) {
        console.error('RAG error:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
} 