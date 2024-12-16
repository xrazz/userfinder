import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ suggestions: [] })
    }

    try {
        const response = await fetch(
            `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`,
            { headers: { 'Accept': 'application/json' } }
        )
        const data = await response.json()
        const suggestions = data[1] || []

        return NextResponse.json({ suggestions })
    } catch (error) {
        console.error('Error fetching suggestions:', error)
        return NextResponse.json({ suggestions: [] })
    }
} 