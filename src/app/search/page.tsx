'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SearchPage() {
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