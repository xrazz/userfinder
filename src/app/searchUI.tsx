'use client'

import React, { useEffect, useState } from 'react'
import { toast, Toaster } from "sonner"
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import { auth, db, firebaseAnalytics } from '@/app/firebaseClient'
import Cookies from "js-cookie"
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { SearchResults } from '@/components/SearchResults'
import { LoggedInSettingsPopover } from '@/components/SettingsPopovers'
import TabDataSkeleton from '@/components/searchProgressUI'
import { Button } from "@/components/ui/button"
import { Settings2, ShieldCheck, ShieldOff } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@radix-ui/themes'
import { motion, useScroll } from 'framer-motion'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
    thumbnail: string | undefined
    isVideo?: boolean
}

interface QueryAnalysis {
    videoPreference: number
    textPreference: number
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

const formatDomain = (domain: string): string => {
    return domain.replace(/^www\./, '')
}




const analyzeQuery = (query: string): QueryAnalysis => {
    const queryLower = query.toLowerCase();

    // Helper to count occurrences of words
    const countMatches = (keywords: string[], text: string): number => 
        keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);

    // Keywords associated with "how-to" or instructional videos
    const instructionalWords = ['how', 'to', 'guide', 'tutorial', 'step', 'watch'];
    const informationalWords = ['research', 'analysis', 'study', 'report', 'comparison'];

    // Question-based intent detection
    const questionWords = ['how', 'what', 'why', 'where', 'when'];

    // Analyze query for video-like or text-like intent
    const hasInstructionalIntent = countMatches(instructionalWords, queryLower) > 0;
    const hasInformationalIntent = countMatches(informationalWords, queryLower) > 0;
    const isQuestion = countMatches(questionWords, queryLower) > 0;

    // Calculate preferences dynamically
    const videoPreference = hasInstructionalIntent || isQuestion ? 0.7 : 0.3;
    const textPreference = hasInformationalIntent ? 1 - videoPreference : 0.5;

    return { videoPreference, textPreference };
};

const mixResults = (
    textResults: Post[],
    videoResults: Post[],
    analysis: QueryAnalysis,
    targetLength: number
): Post[] => {
    const mixedResults: Post[] = [];
    let textIndex = 0;
    let videoIndex = 0;

    // Calculate target video and text counts
    const targetVideos = Math.min(
        Math.round(targetLength * analysis.videoPreference),
        videoResults.length
    );
    const targetText = Math.min(
        targetLength - targetVideos,
        textResults.length
    );

    // Alternate between text and video results
    let useVideo = true;

    while (mixedResults.length < targetLength) {
        if (useVideo && videoIndex < targetVideos) {
            mixedResults.push({ ...videoResults[videoIndex], isVideo: true });
            videoIndex++;
        } else if (!useVideo && textIndex < targetText) {
            mixedResults.push({ ...textResults[textIndex], isVideo: false });
            textIndex++;
        }

        useVideo = !useVideo;

        // Fallback when one type is exhausted
        if (videoIndex >= targetVideos && textIndex < targetText) {
            mixedResults.push({ ...textResults[textIndex], isVideo: false });
            textIndex++;
        } else if (textIndex >= targetText && videoIndex < targetVideos) {
            mixedResults.push({ ...videoResults[videoIndex], isVideo: true });
            videoIndex++;
        }

        // Exit loop when both types are exhausted
        if (videoIndex >= targetVideos && textIndex >= targetText) break;
    }

    return mixedResults;
};
interface SearchTabProps {
    Membership?: string
    name?: string
    email?: string
    userId?: string
    imageUrl?: string
}

interface SearchQuery {
    query: string
    timestamp: number
    userId?: string
}

interface GeneralSearchData {
    query: string
    timestamp: number
    platform: string
    filter?: string
}

const fetchCombinedResults = async (query: string, num: number, siteFilter: string = ''): Promise<Post[]> => {
    try {
        const siteQuery = siteFilter ? `site:${siteFilter} ` : '';
        const fullQuery = `${siteQuery}${query}`;

        const [textResponse, videoResponse] = await Promise.all([
            fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: fullQuery,
                    num: num * 2,
                    start: 0,
                }),
            }),
            fetch('/api/video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: fullQuery, 
                    num: num * 2,
                }),
            }),
        ]);

        if (!textResponse.ok || !videoResponse.ok) {
            throw new Error('One or more API requests failed');
        }

        const textData = await textResponse.json();
        const videoData = await videoResponse.json();

        if (!textData.success || !videoData.success) {
            throw new Error('One or more APIs returned an error');
        }

        const textResults: Post[] = textData.data || [];
        const videoResults: Post[] = videoData.data || [];

        const queryAnalysis = analyzeQuery(query);
        const mixedResults = mixResults(textResults, videoResults, queryAnalysis, num);

        return mixedResults;
    } catch (error: any) {
        console.error('Error fetching combined results:', error.message || error);
        return [];
    }
};

export default function SearchTab({ 
    Membership = '', 
    name = '', 
    email = '', 
    userId = '', 
    imageUrl = '' 
}: SearchTabProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [currentFilter, setCurrentFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchData, setSearchData] = useState<Post[]>([])
    const [selectedSite, setSelectedSite] = useState('Universal search')
    const [customUrl, setCustomUrl] = useState('')
    const [credits, setCredits] = useState(0)
    const [typingQuery, setTypingQuery] = useState('')
    const [pageNumber, setPageNumber] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const RESULTS_PER_PAGE = 10
    const [privacyMode, setPrivacyMode] = useState(() => {
        const saved = localStorage.getItem('privacyMode')
        return saved ? JSON.parse(saved) : false
    })
    const [hasResults, setHasResults] = useState(false)
    const { scrollY } = useScroll()
    const [isScrolled, setIsScrolled] = useState(false)
    const [settingsButtonRef, setSettingsButtonRef] = useState<HTMLButtonElement | null>(null)

    useEffect(() => {
        firebaseAnalytics.logPageView('/')
    }, [])

    useEffect(() => {
        if (!email) {
            const guestCredits = Cookies.get('guestCredits')
            const lastResetDate = Cookies.get('guestCreditsLastReset')
            const today = new Date().toDateString()

            if (!guestCredits || !lastResetDate || lastResetDate !== today) {
                Cookies.set('guestCredits', '3', {
                    expires: new Date(new Date().setHours(24, 0, 0, 0))
                })
                Cookies.set('guestCreditsLastReset', today, {
                    expires: new Date(new Date().setHours(24, 0, 0, 0))
                })
                setCredits(3)
            } else {
                setCredits(parseInt(guestCredits))
            }
            return
        }

        const userDocRef = doc(db, 'users', email)
        const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data()
                const lastReset = userData.lastCreditReset?.toDate()
                const now = new Date()

                if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
                    await updateDoc(userDocRef, {
                        credits: 5,
                        lastCreditReset: now
                    })
                } else {
                    setCredits(userData.credits || 0)
                }
            } else {
                await setDoc(userDocRef, {
                    credits: 10,
                    lastCreditReset: new Date()
                })
            }
        })

        return () => unsubscribe()
    }, [email])

    const trackSearchQuery = async (query: string) => {
        if (privacyMode) return;

        try {
            const generalSearchData: GeneralSearchData = {
                query: query.trim(),
                timestamp: Date.now(),
                platform: selectedSite,
                ...(currentFilter && { filter: currentFilter })
            }

            const generalHistoryRef = collection(db, 'generalSearchHistory')
            await addDoc(generalHistoryRef, generalSearchData)

            if (email) {
                const searchQuery: SearchQuery = {
                    query: query.trim(),
                    timestamp: Date.now(),
                    userId: userId || undefined
                }

                const userDocRef = doc(db, 'users', email)
                const searchHistoryRef = collection(userDocRef, 'searchHistory')
                await addDoc(searchHistoryRef, searchQuery)

                const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]')
                localHistory.push(searchQuery)
                localStorage.setItem('searchHistory', JSON.stringify(localHistory))
            }
        } catch (error) {
            console.error('Error tracking search query:', error)
        }
    }

    const handleSearch = async () => {
        if (searchQuery.trim() !== '') {
            setSearchData([])
            setLoading(true)
            setPageNumber(1)
            setHasMore(true)

            try {
                await trackSearchQuery(searchQuery)

                const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
                const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
                const results = await fetchCombinedResults(
                    `${searchQuery} ${dateFilterString}`,
                    RESULTS_PER_PAGE,
                    siteToSearch
                )

                setSearchData(results)
                setHasResults(results.length > 0)
            } catch (error) {
                console.error("Error fetching data:", error)
                setHasResults(false)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleLoadMore = async () => {
        if (!isLoadingMore && hasMore) {
            setIsLoadingMore(true)
            try {
                const nextPage = pageNumber + 1
                const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
                const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
                const newResults = await fetchCombinedResults(
                    `${searchQuery} ${dateFilterString}`,
                    RESULTS_PER_PAGE,
                    siteToSearch
                )

                if (newResults.length === 0) {
                    setHasMore(false)
                } else {
                    setSearchData(prev => [...prev, ...newResults])
                    setPageNumber(nextPage)
                }
            } catch (error) {
                console.error("Error loading more results:", error)
                setHasMore(false)
            } finally {
                setIsLoadingMore(false)
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

    useEffect(() => {
        localStorage.setItem('privacyMode', JSON.stringify(privacyMode))
    }, [privacyMode])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (loading || hasResults) {
            scrollToTop();
        }
    }, [loading, hasResults]);

    useEffect(() => {
        const unsubscribe = scrollY.onChange(value => {
            setIsScrolled(value > 100)
        })
        return () => unsubscribe()
    }, [scrollY])

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
            {hasResults && (
                <motion.div
                    className={`fixed top-0 left-0 right-0 z-50 bg-background/55 backdrop-blur-sm transition-all duration-300 ${
                        isScrolled ? 'translate-y-0 border-b shadow-sm dark:bg-gray-950/95 bg-gray-100/45' : '-translate-y-full'
                    }`}
                >
                    <div className="max-w-3xl mx-auto px-3 py-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: isScrolled ? 1 : 0, scale: isScrolled ? 1 : 0.8 }}
                                className="flex items-center gap-2"
                            >
                                <span className="font-bold text-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                    LEXY
                                </span>
                            </motion.div>

                            <div className="flex-1">
                                <SearchBar
                                    onSearch={handleSearch}
                                    typingQuery={typingQuery}
                                    setTypingQuery={handleSearchInputChange}
                                    className={`transition-all duration-300 ${
                                        isScrolled ? 'h-10' : 'h-12'
                                    }`}
                                    showSettings={isScrolled}
                                    onSettingsClick={() => {
                                        if (settingsButtonRef) {
                                            settingsButtonRef.click();
                                        }
                                    }}
                                />
                            </div>

                            <div className="hidden">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            ref={setSettingsButtonRef}
                                            variant="secondary"
                                            size="icon"
                                            className="w-8 h-8"
                                        >
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <LoggedInSettingsPopover
                                        selectedSite={selectedSite}
                                        setSelectedSite={setSelectedSite}
                                        currentFilter={currentFilter}
                                        handleFilterChange={handleFilterChange}
                                        customUrl={customUrl}
                                        setCustomUrl={setCustomUrl}
                                        membership={Membership}
                                    />
                                </Popover>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div 
                className={`w-full max-w-3xl mx-auto px-3 transition-all duration-500 ${
                    !hasResults && !loading 
                        ? 'h-[calc(100vh-80px)] flex flex-col justify-center -mt-[15vh]' 
                        : 'py-8'
                }`}
                transition={{ duration: 0.3 }}
            >
                <motion.div
                    animate={{ 
                        scale: isScrolled && hasResults ? 0.95 : 1,
                        opacity: isScrolled && hasResults ? 0 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-6"
                    >
                        {selectedSite === 'custom' ? (
                            <div className="flex items-center justify-center gap-2">
                                <img
                                    src={`https://www.google.com/s2/favicons?sz=32&domain_url=${customUrl}`}
                                    alt=""
                                    className="w-8 h-8"
                                />
                                <span>
                                    Searching <span className="text-purple-600 dark:text-purple-400">{formatDomain(customUrl)}</span>
                                </span>
                            </div>
                        ) : (
                            "What can I help you find?"
                        )}
                    </motion.h1>

                    <SearchBar
                        onSearch={handleSearch}
                        typingQuery={typingQuery}
                        setTypingQuery={handleSearchInputChange}
                    />

                    <motion.div 
                        className="flex items-center justify-between gap-2 mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex flex-wrap items-center gap-1">
                            <Badge size="1" color="crimson">
                                {selectedSite === 'custom' ? (customUrl || 'Custom Site') : selectedSite}
                            </Badge>
                            {currentFilter && (
                                <Badge size="1" color="orange">
                                    {mapFilterToDate(currentFilter).replace('last', '')}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="privacy-mode"
                                checked={privacyMode}
                                onCheckedChange={setPrivacyMode}
                                className="data-[state=checked]:bg-purple-600"
                            />
                            <Label htmlFor="privacy-mode" className="text-sm text-muted-foreground flex items-center gap-1">
                                Stealth
                                {privacyMode ? (
                                    <ShieldCheck className="w-3 h-3" />
                                ) : (
                                    <ShieldOff className="w-3 h-3" />
                                )}
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="w-8 h-8"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <LoggedInSettingsPopover
                                    selectedSite={selectedSite}
                                    setSelectedSite={setSelectedSite}
                                    currentFilter={currentFilter}
                                    handleFilterChange={handleFilterChange}
                                    customUrl={customUrl}
                                    setCustomUrl={setCustomUrl}
                                    membership={Membership}
                                />
                            </Popover>
                        </div>
                    </motion.div>
                </motion.div>

                {loading && <TabDataSkeleton />}
                {hasResults && (
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
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        setCustomUrl={setCustomUrl}
                        setSelectedSite={setSelectedSite}
                        handleSearch={handleSearch}
                    />
                )}
            </motion.div>
        </main>
    )
}