import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Set runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 20; // 20 seconds timeout

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
    try {
        const { queries } = await req.json()

        const prompt = `Analyze these search queries and provide insights about:
1. Most common topics/themes
2. Search patterns and trends
3. User interests and behaviors
4. Notable changes or patterns over time
5. Recommendations for content or features

Queries data:
${JSON.stringify(queries, null, 2)}

Provide a detailed but concise analysis with specific examples and actionable insights.`

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
        })

        return NextResponse.json({
            analysis: completion.choices[0].message.content
        })
    } catch (error) {
        console.error('Error analyzing queries:', error)
        return NextResponse.json(
            { error: 'Failed to analyze queries' },
            { status: 500 }
        )
    }
} 