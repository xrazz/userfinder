'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'
import { Button } from "@/components/ui/button"
import { SparklesIcon, Search, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SharedResult {
    content: string
    query: string
    timestamp: number
    results?: any[]
    topics: string[]
}

interface LoadingState {
    initial: boolean
    loadMore: boolean
}

const RESULTS_PER_PAGE = 10

export default function SharedResultPage({ params }: { params: { id: string } }) {
    const [result, setResult] = useState<SharedResult | null>(null)
    const [loadingState, setLoadingState] = useState<LoadingState>({
        initial: true,
        loadMore: false
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [displayedResults, setDisplayedResults] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchSharedResult = async () => {
            try {
                const resultDoc = await getDoc(doc(db, 'shared_results', params.id))
                if (resultDoc.exists()) {
                    const data = resultDoc.data() as SharedResult
                    setResult(data)
                    // Initialize displayed results with first page
                    setDisplayedResults(data.results?.slice(0, RESULTS_PER_PAGE) || [])
                    setHasMore((data.results?.length || 0) > RESULTS_PER_PAGE)
                } else {
                    toast.error("Result not found")
                }
            } catch (error) {
                console.error('Error fetching shared result:', error)
                toast.error("Failed to load shared result")
            } finally {
                setLoadingState(prev => ({ ...prev, initial: false }))
            }
        }

        fetchSharedResult()
    }, [params.id])

    const handleLoadMore = () => {
        if (!result?.results || loadingState.loadMore || !hasMore) return

        setLoadingState(prev => ({ ...prev, loadMore: true }))
        try {
            const nextPage = currentPage + 1
            const start = currentPage * RESULTS_PER_PAGE
            const end = start + RESULTS_PER_PAGE
            const newResults = result.results.slice(start, end)
            
            if (newResults.length === 0) {
                setHasMore(false)
            } else {
                setDisplayedResults(prev => [...prev, ...newResults])
                setCurrentPage(nextPage)
            }
        } catch (error) {
            console.error('Error loading more results:', error)
            toast.error('Failed to load more results')
        } finally {
            setLoadingState(prev => ({ ...prev, loadMore: false }))
        }
    }

    if (loadingState.initial) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <SparklesIcon className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground">Loading shared result...</p>
                </div>
            </div>
        )
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">This shared result is no longer available</p>
                    <Button onClick={() => router.push('/')}>Go to Search</Button>
                </div>
            </div>
        )
    }

    // Extract follow-up questions from content
    const [mainContent, followUpQuestions] = result.content.split('---').map(part => part.trim())
    const questions = followUpQuestions
        ?.split('\n')
        .filter(line => line.startsWith('•'))
        .map(line => line.replace('•', '').trim()) || []

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-primary" />
                        <span className="font-semibold">Lexy</span>
                    </div>
                    <Button onClick={() => router.push('/login')} variant="outline">Sign in</Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Search Query */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Search Results</h1>
                    <p className="text-muted-foreground">
                        for query: <span className="font-medium text-foreground">&quot;{result.query}&quot;</span>
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
                    <div className="prose dark:prose-invert max-w-none">
                        {mainContent.split(/(\*\*.*?\*\*)/).map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i}>{part.slice(2, -2)}</strong>
                            }
                            return part
                        })}
                    </div>
                </div>

                {/* Follow-up Questions */}
                {questions.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                            <SparklesIcon className="w-4 h-4" />
                            Follow-up Questions
                        </h4>
                        <div className="grid gap-2">
                            {questions.map((question, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="justify-start text-left h-auto py-2 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() => router.push(`/?q=${encodeURIComponent(question)}`)}
                                >
                                    <span className="line-clamp-2">{question}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Topics */}
                {result.topics?.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4">Related Topics</h2>
                        <div className="flex flex-wrap gap-2">
                            {result.topics.map((topic, idx) => (
                                <div 
                                    key={idx}
                                    className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                                >
                                    {topic}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Source Links */}
                {displayedResults.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h2 className="text-lg font-semibold">Source Links</h2>
                        <div className="grid gap-3">
                            {displayedResults.map((source, idx) => (
                                <div 
                                    key={idx}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
                                >
                                    <div className="flex-none mt-0.5">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                            {idx + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <a
                                            href={source.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium hover:underline truncate block"
                                        >
                                            {source.title}
                                        </a>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {source.snippet}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={loadingState.loadMore}
                                    className="gap-2"
                                >
                                    {loadingState.loadMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More Results'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* CTAs */}
                <div className="bg-primary/5 border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-2">Want to explore more?</h2>
                    <p className="text-muted-foreground mb-4">
                        Sign up to access advanced search features, save results, and get AI-powered insights.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={() => router.push('/login')} className="gap-2">
                            Get Started <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => router.push(`/?q=${encodeURIComponent(result.query)}`)}
                            className="gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Try a Search
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
} 