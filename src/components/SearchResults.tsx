import React from 'react'
import Image from 'next/image'
import { Card } from "@/components/ui/card"
import SearchSummaryBot from '../app/llm/SearchSummaryBot'
import ExpandableSearchResult from '../app/llm/ExpandableSearchResult'

interface Post {
    title: string
    link: string
    snippet: string
}

interface SearchResultsProps {
    platform: string
    posts: Post[]
    logo: string
    searchQuery: string
    currentFilter: string
    onBookmark: (post: Post) => void
    onEngage: (link: string) => void
    onCopyUrl: (link: string) => void
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    platform,
    posts,
    logo,
    searchQuery,
    currentFilter,
    onBookmark,
    onEngage,
    onCopyUrl
}) => {
    if (posts.length === 0) {
        return <div></div>
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                <span className="text-sm text-muted-foreground">{currentFilter}</span>
            </div>
            <SearchSummaryBot searchData={posts} searchQuery={searchQuery} />
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1 mt-6">
                {posts.map((post, index) => (
                    <Card key={index} className="flex shadow-none flex-col h-full">
                        <ExpandableSearchResult
                            key={index}
                            post={post}
                            onEngage={onEngage}
                            onBookmark={onBookmark}
                            onCopyUrl={onCopyUrl}
                        />
                    </Card>
                ))}
            </div>
        </div>
    )
} 