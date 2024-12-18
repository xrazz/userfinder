import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/firebaseClient'
import { collection, getDocs, query, where, orderBy, doc } from 'firebase/firestore'

export async function GET(req: NextRequest) {
    try {
        const email = req.headers.get('email')
        
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userDocRef = doc(db, 'users', email)
        const searchHistoryRef = collection(userDocRef, 'searchHistory')
        const q = query(searchHistoryRef, orderBy('timestamp', 'desc'))
        
        const querySnapshot = await getDocs(q)
        const searchHistory = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ success: true, data: searchHistory })

    } catch (error) {
        console.error('Error fetching search history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch search history' },
            { status: 500 }
        )
    }
} 