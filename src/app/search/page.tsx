'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SearchPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    useEffect(() => {
        const query = searchParams?.get('q')
        if (query) {
            // Redirect to home page with the search query
            router.push(`/?q=${encodeURIComponent(query)}`)
        } else {
            // If no query parameter, redirect to home
            router.push('/')
        }
    }, [searchParams, router])
    
    return null // This page doesn't render anything, it just handles redirection
}

export default function SearchPage() {
    return (
        <Suspense fallback={null}>
            <SearchPageContent />
        </Suspense>
    )
} 