'use client'

import React, { useEffect, useState } from 'react'
import { toast, Toaster } from "sonner"
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import { auth, db, firebaseAnalytics } from '@/app/firebaseClient'
import Cookies from "js-cookie"
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { SearchResults } from '@/components/SearchResults'
import { LoggedInSettingsPopover, LoggedOutSettingsPopover } from '@/components/SettingsPopovers'
import TabDataSkeleton from '@/components/searchProgressUI'
import QueryTutorialModal from './docs/QueryModal'
import { Button } from "@/components/ui/button"
import { Settings2, Search } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@radix-ui/themes'
import { motion } from 'framer-motion'

const MEMBERSHIP_LEVELS = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Pro'
} as const

enum DateFilter {
    Today = 'today',
    Week = 'last week',
    Latest = 'last 2 months',
    Oldest = 'last 2 years',
    Lifetime = 'no date filter'
}

interface Post {
    title: string
    link: string
    snippet: string
}

const sites = [
    { name: 'Universal search', icon: '/logo.svg' },
    { name: 'Reddit.com', icon: '/reddit.svg' },
    { name: 'Twitter.com', icon: '/twitter.svg' },
    { name: 'Quora.com', icon: '/quora.svg' },
    { name: 'news.ycombinator.com', icon: '/y-combinator.svg' },
    { name: 'Dev.to', icon: '/dev.svg' },
    { name: 'stackexchange.com', icon: '/stackexchange.svg' },
]

const mapFilterToDate = (filter: string): DateFilter => {
    switch (filter) {
        case 'today': return DateFilter.Today
        case 'week': return DateFilter.Week
        case 'newest': return DateFilter.Latest
        case 'oldest': return DateFilter.Oldest
        case 'lifetime': return DateFilter.Lifetime
        default: return DateFilter.Lifetime
    }
}

interface SearchTabProps {
    Membership?: string
    name?: string
    email?: string
    userId?: string
    imageUrl?: string
}

export default function SearchTab({ Membership = '', name = '', email = '', userId = '', imageUrl = '' }: SearchTabProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [currentFilter, setCurrentFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchData, setSearchData] = useState<Post[]>([])
    const [selectedSite, setSelectedSite] = useState('Universal search')
    const [resultCount, setResultCount] = useState<number>(10)
    const [customUrl, setCustomUrl] = useState('')
    const [credits, setCredits] = useState(0)
    const [typingQuery, setTypingQuery] = useState('')

    useEffect(() => {
        firebaseAnalytics.logPageView('/')
        console.log("Firebase Analytics: Page view logged for '/'")
    }, [])

    useEffect(() => {
        if (!email) {
            // Handle non-registered users' credits
            const guestCredits = Cookies.get('guestCredits');
            const lastResetDate = Cookies.get('guestCreditsLastReset');
            const today = new Date().toDateString();

            if (!guestCredits || !lastResetDate || lastResetDate !== today) {
                Cookies.set('guestCredits', '3', { 
                    expires: new Date(new Date().setHours(24, 0, 0, 0)) // Expires at midnight
                });
                Cookies.set('guestCreditsLastReset', today, {
                    expires: new Date(new Date().setHours(24, 0, 0, 0))
                });
                setCredits(3);
            } else {
                setCredits(parseInt(guestCredits));
            }
            return;
        }

        // Handle registered users' credits
        const userDocRef = doc(db, 'users', email);
        const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const lastReset = userData.lastCreditReset?.toDate();
                const now = new Date();
                
                // Check if we need to reset credits (new day)
                if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
                    // Reset credits to 10 at the start of each day
                    await updateDoc(userDocRef, {
                        credits: 5,
                        lastCreditReset: now
                    });
                } else {
                    setCredits(userData.credits || 0);
                }
            } else {
                // Initialize new user with 10 credits
                await setDoc(userDocRef, {
                    credits: 10,
                    lastCreditReset: new Date()
                });
            }
        });

        return () => unsubscribe();
    }, [email]);

    useEffect(() => {
        if (searchData.length > 0) {
            setLoading(false)
        }
    }, [searchData])

    useEffect(() => {
        const cachedData = JSON.parse(localStorage.getItem(`searchData`) || '[]')
        setSearchData(cachedData)
    }, [email])

    const fetchResult = async (query: string): Promise<any[]> => {
        try {
            const response = await fetch('/api/searchApify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query, num: resultCount })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                return data.data
            } else {
                throw new Error(data.error || 'Unknown API error occurred')
            }
        } catch (error: any) {
            console.error('Error fetching results:', error.message || error)
            return []
        }
    }

    const handleSearch = async () => {
        if (searchQuery.trim() !== '') {
            const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite

            setSearchData([])
            setLoading(true)

            try {
                const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
                const Results = await fetchResult(`site:${siteToSearch} ${searchQuery} ${dateFilterString} `)

                setSearchData(Results)
                localStorage.setItem('searchData', JSON.stringify(Results))
                localStorage.setItem('history', JSON.stringify({ title: searchQuery, data: Results }))

            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleFilterChange = (value: string) => {
        setCurrentFilter(value)
    }

    const handleBookmark = async (post: Post) => {
        try {
            const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
            const updatedBookmarks = [...existingBookmarks, post]
            localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
            toast.success("Added to bookmarks", {
                description: `Bookmarked: ${post.title}`,
            })
        } catch (error) {
            console.error("Error adding bookmark:", error)
            toast.error("Failed to add bookmark", {
                description: "An error occurred while adding the bookmark.",
            })
        }
    }

    const handleLogout = async () => {
        Cookies.remove("token")
        window.location.reload()
    }

    const handleEngage = (link: string) => {
        window.open(decodeURIComponent(link), '_blank')
    }

    const handleCopyUrl = (link: string) => {
        navigator.clipboard.writeText(decodeURIComponent(link))
            .then(() => {
                toast("URL has been copied", {
                    action: {
                        label: "OK",
                        onClick: () => console.log("Undo"),
                    },
                })
            })
            .catch((err) => {
                console.error('Failed to copy: ', err)
                toast("Failed to copy URL", {
                    description: "An error occurred while copying the URL.",
                })
            })
    }

    const handleSearchInputChange = (value: string) => {
        setTypingQuery(value)
        setSearchQuery(value)
    }

    return (
        <main className="min-h-screen bg-background">
            <Toaster position="bottom-center" />
            <Header
                userId={userId}
                name={name}
                email={email}
                imageUrl={imageUrl}
                onLogout={handleLogout}
            />
            <div className="w-full max-w-3xl mx-auto px-3 py-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-6"
                >
                    What can I help you find?
                </motion.h1>

                <SearchBar
                    onSearch={handleSearch}
                    typingQuery={typingQuery}
                    setTypingQuery={handleSearchInputChange}
                />

                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex flex-wrap items-center gap-1">
                        <div>
                            <QueryTutorialModal />
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 hover:text-gray-900"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    <span className="sr-only">Settings</span>
                                </Button>
                            </PopoverTrigger>
                            <LoggedInSettingsPopover
                                selectedSite={selectedSite}
                                setSelectedSite={setSelectedSite}
                                resultCount={resultCount}
                                setResultCount={setResultCount}
                                currentFilter={currentFilter}
                                handleFilterChange={handleFilterChange}
                                customUrl={customUrl}
                                setCustomUrl={setCustomUrl}
                                membership={Membership}
                            />
                        </Popover>

                        <Badge size="1" color="crimson">
                            {selectedSite === 'custom' ? (customUrl || 'Custom Site') : selectedSite}
                        </Badge>
                        {currentFilter && (
                            <Badge size="1" color="orange">
                                {mapFilterToDate(currentFilter).replace('last', '')}
                            </Badge>
                        )}
                        <Badge color="cyan" variant="soft">{resultCount}</Badge>
                    </div>

                    <Button
                        onClick={handleSearch}
                        variant="secondary"
                        size="icon"
                        className="w-8 h-8 rounded-full text-white bg-gray-700 hover:bg-gray-800 hover:text-white"
                    >
                        <Search className="w-2 h-2 md:w-2 md:h-2" />
                        <span className="sr-only">Search</span>
                    </Button>
                </div>

                {loading && <TabDataSkeleton />}
                <SearchResults
                    platform={selectedSite === 'custom' ? customUrl : selectedSite}
                    posts={searchData}
                    logo={selectedSite === 'custom' ? '/custom.png' : sites.find(site => site.name === selectedSite)?.icon || '/custom.png'}
                    searchQuery={searchQuery}
                    currentFilter={currentFilter}
                    onBookmark={handleBookmark}
                    onEngage={handleEngage}
                    onCopyUrl={handleCopyUrl}
                    email={email}
                />
            </div>
        </main>
    )
}

function getDateFilterString(dateFilter: DateFilter): string {
    const today = new Date()

    const formatDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const twoMonthsAgo = new Date(today)
    twoMonthsAgo.setMonth(today.getMonth() - 2)

    const twoYearsAgo = new Date(today)
    twoYearsAgo.setFullYear(today.getFullYear() - 2)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)

    const todayStr = formatDate(today)
    const twoMonthsAgoStr = formatDate(twoMonthsAgo)
    const twoYearsAgoStr = formatDate(twoYearsAgo)
    const yesterdayStr = formatDate(yesterday)
    const oneWeekAgoStr = formatDate(oneWeekAgo)

    switch (dateFilter) {
        case DateFilter.Today:
            return `after:${yesterdayStr} before:${todayStr}`
        case DateFilter.Week:
            return `after:${oneWeekAgoStr} before:${todayStr}`
        case DateFilter.Latest:
            return `after:${twoMonthsAgoStr} before:${todayStr}`
        case DateFilter.Oldest:
            return `after:${twoYearsAgoStr} before:${todayStr}`
        case DateFilter.Lifetime:
            return ''
        default:
            return ''
    }
}