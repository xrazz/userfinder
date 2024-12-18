import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/firebaseClient'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams
        const limitParam = parseInt(searchParams.get('limit') || '100')
        
        const historyRef = collection(db, 'generalSearchHistory')
        const q = query(
            historyRef, 
            orderBy('timestamp', 'desc'),
            limit(limitParam)
        )
        
        const querySnapshot = await getDocs(q)
        const searchHistory = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ success: true, data: searchHistory })

    } catch (error) {
        console.error('Error fetching general search history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch search history' },
            { status: 500 }
        )
    }
} 