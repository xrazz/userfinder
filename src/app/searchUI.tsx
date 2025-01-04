'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { toast, Toaster } from "sonner"
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore'
import { auth, db, firebaseAnalytics } from '@/app/firebaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from "js-cookie"
import { Header } from '@/components/Header'
import { SearchBar } from '@/components/SearchBar'
import { SearchResults } from '@/components/SearchResults'
import { LoggedInSettingsPopover, LoggedOutSettingsPopover } from '@/components/SettingsPopovers'
import TabDataSkeleton from '@/components/searchProgressUI'
import QueryTutorialModal from './docs/QueryModal'
import { Button } from "@/components/ui/button"
import { Settings2, Search, ShieldCheck, ShieldOff, SparklesIcon } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@radix-ui/themes'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

const MEMBERSHIP_LEVELS = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Pro'
} as const

enum DateFilter {
    Today = '24h',
    Week = 'week',
    Month = 'month',
    ThreeMonths = '3months',
    SixMonths = '6months',
    Year = 'year',
    Lifetime = 'all'
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

const mapFilterToDisplayText = (filter: string): string => {
    switch (filter) {
        case '24h': return 'Last 24 hours'
        case 'week': return 'Last week'
        case 'month': return 'Last month'
        case '3months': return 'Last 3 months'
        case '6months': return 'Last 6 months'
        case 'year': return 'Last year'
        case 'all': return 'All time'
        default: return ''
    }
}

const mapFilterToDate = (filter: string): DateFilter => {
    switch (filter) {
        case '24h': return DateFilter.Today
        case 'week': return DateFilter.Week
        case 'month': return DateFilter.Month
        case '3months': return DateFilter.ThreeMonths
        case '6months': return DateFilter.SixMonths
        case 'year': return DateFilter.Year
        case 'all': return DateFilter.Lifetime
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

type SearchType = 'web' | 'products' | 'people';

interface SearchFilters {
    // Product filters
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    
    // People filters
    includeEmail?: boolean;
    includePhone?: boolean;
    includeSocial?: boolean;
    
    // News filters
    dateRange?: string;
    source?: string;
}

const getSearchTypeQuery = (type: SearchType, baseQuery: string): string => {
    switch (type) {
        case 'products':
            return `${baseQuery} (site:amazon.com OR site:ebay.com OR site:etsy.com OR inurl:product OR inurl:shop) -inurl:blog -inurl:news`;
        case 'people':
            return `${baseQuery} (site:linkedin.com OR site:twitter.com OR site:facebook.com OR intitle:"profile" OR inurl:about) -inurl:company`;
        default:
            return baseQuery;
    }
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

const formatDomain = (domain: string): string => {
    return domain.replace(/^www\./, '')
}

const fileTypes = [
    { value: "all", label: "All Files", dork: "" },
    { value: "pdf", label: "PDF Documents", dork: "filetype:pdf" },
    { value: "doc", label: "Word Documents", dork: "(filetype:doc OR filetype:docx)" },
    { value: "xls", label: "Excel Spreadsheets", dork: "(filetype:xls OR filetype:xlsx)" },
    { value: "ppt", label: "PowerPoint", dork: "(filetype:ppt OR filetype:pptx)" },
    { value: "txt", label: "Text Files", dork: "filetype:txt" },
    { value: "csv", label: "CSV Files", dork: "filetype:csv" },
    { value: "json", label: "JSON Files", dork: "filetype:json" },
    { value: "xml", label: "XML Files", dork: "filetype:xml" },
    { value: "sql", label: "SQL Files", dork: "filetype:sql" },
    { value: "zip", label: "Archives", dork: "(filetype:zip OR filetype:rar)" }
]

export default function SearchTab({ Membership = '', name = '', email = '', userId = '', imageUrl = '' }: SearchTabProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedSite, setSelectedSite] = useState('Universal search');
    const [customUrl, setCustomUrl] = useState('');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [showSettings, setShowSettings] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState('all');
    const [searchType, setSearchType] = useState<SearchType>('web');
    const [privacyMode, setPrivacyMode] = useState(() => {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('privacyMode')
        return saved ? JSON.parse(saved) : false
    });
    const RESULTS_PER_PAGE = 10; // Constant for number of results per page
    const [credits, setCredits] = useState(0)
    const [typingQuery, setTypingQuery] = useState('')
    const [hasResults, setHasResults] = useState(false)
    const { scrollY } = useScroll()
    const [isScrolled, setIsScrolled] = useState(false)
    const [settingsButtonRef, setSettingsButtonRef] = useState<HTMLButtonElement | null>(null);
    const [searchInProgress, setSearchInProgress] = useState(false)
    const initialSearchRef = useRef(false)
    const urlTriggeredRef = useRef(false)
    const [showBetaDialog, setShowBetaDialog] = useState(false)

    const reloadPage = useCallback(() => {
        // Soft reload using router
        router.refresh()
        
        // If we need a hard reload, uncomment this:
        // window.location.reload()
    }, [router])

    const autoReload = useCallback((delay: number = 5000) => {
        setTimeout(() => {
            reloadPage()
        }, delay)
    }, [reloadPage])

    useEffect(() => {
        firebaseAnalytics.logPageView('/')
        console.log("Firebase Analytics: Page view logged for '/'")
    }, [])

    useEffect(() => {
        if (!email) {
            // Handle non-registered users' credits
            setCredits(0);
            return;
        }

        // Handle registered users' credits
        const userDocRef = doc(db, 'users', email);
        const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const lastReset = userData.lastCreditReset;
                let lastResetDate: Date | null = null;

                // Handle different timestamp formats
                if (lastReset) {
                    if (lastReset instanceof Timestamp) {
                        lastResetDate = lastReset.toDate();
                    } else if (lastReset instanceof Date) {
                        lastResetDate = lastReset;
                    } else if (typeof lastReset === 'string') {
                        lastResetDate = new Date(lastReset);
                    }
                }

                const now = new Date();
                const shouldReset = !lastResetDate || 
                    lastResetDate.toDateString() !== now.toDateString();

                if (shouldReset) {
                    const membershipLevel = userData.membershipLevel || 'Free';
                    let creditsToSet = 5;  // Default to Free tier credits

                    // Normalize membership level to handle different cases
                    const normalizedLevel = membershipLevel.toLowerCase();
                    if (normalizedLevel === 'free') {
                        creditsToSet = 5;
                    } else if (normalizedLevel === 'pro' || normalizedLevel === 'basic') {
                        creditsToSet = 50;
                    }

                    // If user has an active subscription, ensure they get Pro credits
                    if (userData?.isSubscribed && userData?.subscriptionStatus === 'active') {
                        creditsToSet = 50;
                    }

                    await updateDoc(userDocRef, {
                        credits: creditsToSet,
                        lastCreditReset: Timestamp.fromDate(now)
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
        if (searchResults.length > 0) {
            setLoading(false)
        }
    }, [searchResults])

    // new crawler for text
    const fetchResults = async (query: string, page: number): Promise<Post[]> => {
        try {
            // Log della query per debug
            console.log('Query being sent to API:', query);
            
            // Create AbortController with 30 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
            
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,  // La query include già il filetype dalla SearchBar
                    num: RESULTS_PER_PAGE,
                    start: (page - 1) * RESULTS_PER_PAGE,
                }),
                signal: controller.signal
            });

            // Clear timeout
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Log dei risultati per debug
            console.log('API Response:', data);

            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.error || 'Unknown API error occurred');
            }
        } catch (error: any) {
            console.error('Error fetching results:', error.message || error);
            // Check if it's an abort error
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 30 seconds');
            }
            return [];
        }
    };

    const trackSearchQuery = async (query: string) => {
        // Don't track anything if privacy mode is ON
        if (privacyMode) {
            return;
        }

        try {
            // Track general anonymous data
            const generalSearchData: GeneralSearchData = {
                query: query.trim(),
                timestamp: Date.now(),
                platform: selectedSite,
                ...(currentFilter && { filter: currentFilter })
            }

            // Save to general search history collection
            const generalHistoryRef = collection(db, 'generalSearchHistory')
            await addDoc(generalHistoryRef, generalSearchData)

            // Track user-specific data if user is logged in
            if (email) {
                const searchQuery: SearchQuery = {
                    query: query.trim(),
                    timestamp: Date.now(),
                    userId: userId || undefined
                }

                // Save to Firebase for logged-in users
                const userDocRef = doc(db, 'users', email)
                const searchHistoryRef = collection(userDocRef, 'searchHistory')
                await addDoc(searchHistoryRef, searchQuery)

                // Save to localStorage
                const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]')
                localHistory.push(searchQuery)
                localStorage.setItem('searchHistory', JSON.stringify(localHistory))
            }
        } catch (error) {
            console.error('Error tracking search query:', error)
        }
    }

    // Aggiungi questa funzione helper per costruire la query in modo consistente
    const buildSearchQuery = (baseQuery: string, siteToSearch: string, dateFilter: string, type: SearchType, filters?: SearchFilters): string => {
        let query = getSearchTypeQuery(type, baseQuery);
        
        // Aggiungi i filtri specifici per tipo
        if (filters) {
            if (type === 'products') {
                if (filters.minPrice) {
                    query += ` price:>${filters.minPrice}`;
                }
                if (filters.maxPrice) {
                    query += ` price:<${filters.maxPrice}`;
                }
                if (filters.location) {
                    query += ` location:"${filters.location}"`;
                }
            } else if (type === 'people') {
                if (filters.includeEmail) {
                    query += ` (intext:email OR intext:mail OR intext:@)`;
                }
                if (filters.includePhone) {
                    query += ` (intext:phone OR intext:tel OR intext:mobile)`;
                }
                if (filters.includeSocial) {
                    query += ` (site:linkedin.com OR site:twitter.com OR site:facebook.com OR site:instagram.com)`;
                }
            }
        }
        
        if (siteToSearch && siteToSearch !== 'Universal search') {
            query += ` site:${siteToSearch.toLowerCase()}`;
        }
        
        if (dateFilter && dateFilter !== 'all') {
            const dateString = getDateFilterString(mapFilterToDate(dateFilter));
            query += ` ${dateString}`;
        }
        
        return query;
    }

    const handleSearchInputChange = (value: string) => {
        setTypingQuery(value)
        setSearchQuery(value)
    }

    const handleSearch = async (queryToUse?: string, newSearchType?: SearchType, filters?: SearchFilters) => {
        // Prevent multiple simultaneous searches
        if (searchInProgress) {
            console.log('Search already in progress, skipping...')
            return
        }

        // Use provided query or current search query
        const queryToSearch = (queryToUse || searchQuery).trim()
        if (!queryToSearch) return

        try {
            setSearchInProgress(true)
            setSearchResults([])
            setLoading(true)
            setCurrentPage(1)
            setHasMore(true)

            // Update search type if provided
            if (newSearchType) {
                setSearchType(newSearchType)
            }

            // Only update search query state if a new query is provided
            if (queryToUse) {
                setSearchQuery(queryToUse)
                setTypingQuery(queryToUse)
            }

            // Only track search if it's not URL-triggered
            if (!urlTriggeredRef.current) {
                await trackSearchQuery(queryToSearch)
            }
            
            const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
            const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
            
            const finalQuery = buildSearchQuery(queryToSearch, siteToSearch, dateFilterString, newSearchType || searchType, filters)
            console.log('Final query:', finalQuery)
            
            const Results = await fetchResults(finalQuery, 1)
            setSearchResults(Results)
            setHasResults(Results.length > 0)
        } catch (error) {
            console.error("Error fetching data:", error)
            setHasResults(false)
            
            if (error instanceof Error && error.message.includes('network')) {
                toast.error("Network error. Retrying in 5 seconds...")
                autoReload(5000)
            }
        } finally {
            setLoading(false)
            setSearchInProgress(false)
            // Reset URL trigger flag after search is complete
            urlTriggeredRef.current = false
        }
    }

    const handleLoadMore = async () => {
        if (loading || !hasMore) return;
        
        try {
            setLoading(true);
            const nextPage = currentPage + 1;
            
            const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite;
            const dateFilterString = currentFilter !== 'all' ? getDateFilterString(mapFilterToDate(currentFilter)) : '';
            
            const finalQuery = buildSearchQuery(searchQuery, siteToSearch, dateFilterString, searchType);
            const newResults = await fetchResults(finalQuery, nextPage);
            
            if (newResults.length === 0) {
                setHasMore(false);
            } else {
                setSearchResults((prev: Post[]) => [...prev, ...newResults]);
                setCurrentPage(nextPage);
            }
        } catch (error) {
            console.error('Error loading more results:', error);
            toast.error('An error occurred while loading more results');
        } finally {
            setLoading(false);
        }
    };

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
        try {
            await auth.signOut()
            Cookies.remove("token")
            router.push('/') // Reindirizza alla home page dopo il logout
        } catch (error) {
            console.error('Error during logout:', error)
            toast.error("Error during logout", {
                description: "Please try again.",
            })
        }
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

    useEffect(() => {
        localStorage.setItem('privacyMode', JSON.stringify(privacyMode))
    }, [privacyMode])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (loading) {
            scrollToTop();
        }
    }, [loading]);

    useEffect(() => {
        if (hasResults) {
            scrollToTop();
        }
    }, [hasResults]);

    useEffect(() => {
        const unsubscribe = scrollY.onChange(value => {
            setIsScrolled(value > 100)
        })
        return () => unsubscribe()
    }, [scrollY])

    // Aggiungi questa funzione per gestire il cambio di tipo file
    const handleFileTypeChange = (value: string) => {
        setSelectedFileType(value);
        // Only trigger a new search if there's an active search query and it's not the first search
        if (searchQuery.trim() && initialSearchRef.current) {
            handleSearch(searchQuery);
        }
    }

    // Modify useEffect for URL-based search
    useEffect(() => {
        const query = searchParams?.get('q')
        
        // Only proceed if we have a query and haven't done the initial search
        if (query && !initialSearchRef.current && !searchInProgress) {
            initialSearchRef.current = true
            urlTriggeredRef.current = true
            setSearchQuery(query)
            setTypingQuery(query)
            handleSearch(query)
        }
    }, [searchParams, searchInProgress])

    const handleCreditUpdate = async () => {
        if (!email) return;
        
        try {
            const userDocRef = doc(db, 'users', email);
            await updateDoc(userDocRef, {
                credits: credits - 1
            });
        } catch (error) {
            console.error('Error updating credits:', error);
        }
    };

    // Add beta dialog check
    useEffect(() => {
        const hasSeenBeta = localStorage.getItem('hasSeenBetaDialog')
        if (!hasSeenBeta) {
            setShowBetaDialog(true)
        }
    }, [])

    const handleCloseBetaDialog = () => {
        localStorage.setItem('hasSeenBetaDialog', 'true')
        setShowBetaDialog(false)
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

            {/* Beta Version Dialog */}
            <Dialog open={showBetaDialog} onOpenChange={handleCloseBetaDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-purple-500" />
                            Welcome to the Beta!
                        </DialogTitle>
                        <DialogDescription className="pt-2 space-y-2">
                            <p>
                                You're among the first to try our new search experience. As we're in beta:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Some features may be experimental</li>
                                <li>We're actively improving and adding new capabilities</li>
                                <li>Your feedback is invaluable to us</li>
                            </ul>
                            <p className="pt-2 text-sm text-muted-foreground">
                                Thank you for being an early user!
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleCloseBetaDialog} className="w-full">
                            Got it, let's explore!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {hasResults && (
                <motion.div
                    className={`fixed top-0 left-0 right-0 z-50 bg-background/55 backdrop-blur-sm transition-all duration-300 ${
                        isScrolled ? 'translate-y-0 border-b shadow-sm dark:bg-gray-950/95 bg-gray-100/45' : '-translate-y-full'
                    }`}
                >
                    <div className="max-w-3xl mx-auto px-3 py-2">
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
                                    onFileTypeChange={handleFileTypeChange}
                                    selectedFileType={selectedFileType}
                                    fileTypes={fileTypes}
                                    searchType={searchType}
                                    onSearchTypeChange={(type) => {
                                        setSearchType(type);
                                        // Non eseguiamo qui la ricerca perché verrà gestita dal componente SearchBar
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

                            {!isScrolled && (
                                <div className="flex items-center gap-2">
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
                            )}
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
                        onFileTypeChange={handleFileTypeChange}
                        selectedFileType={selectedFileType}
                        fileTypes={fileTypes}
                        searchType={searchType}
                        onSearchTypeChange={(type) => {
                            setSearchType(type);
                            // Non eseguiamo qui la ricerca perché verrà gestita dal componente SearchBar
                        }}
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
                            {currentFilter && mapFilterToDisplayText(currentFilter) && (
                                <Badge size="1" color="orange">
                                    {mapFilterToDisplayText(currentFilter)}
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
                                        className="w-8 h-8 rounded-lg hover:bg-gray-100 hover:text-gray-900"
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
                        posts={searchResults}
                        logo={selectedSite === 'custom' ? '/custom.png' : sites.find(site => site.name === selectedSite)?.icon || '/custom.png'}
                        searchQuery={searchQuery}
                        currentFilter={currentFilter}
                        onBookmark={handleBookmark}
                        onEngage={handleEngage}
                        onCopyUrl={handleCopyUrl}
                        email={email}
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                        isLoadingMore={loading}
                        setCustomUrl={setCustomUrl}
                        setSelectedSite={setSelectedSite}
                        handleSearch={handleSearch}
                        credits={credits}
                        onCreditUpdate={handleCreditUpdate}
                    />
                )}
            </motion.div>
        </main>
    )
}

function getDateFilterString(dateFilter: DateFilter): string {
    const today = new Date()
    const formatDate = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const todayStr = formatDate(today)
    const getDateBefore = (days: number) => {
        const date = new Date(today)
        date.setDate(today.getDate() - days)
        return formatDate(date)
    }

    switch (dateFilter) {
        case DateFilter.Today:
            return `after:${getDateBefore(1)} before:${todayStr}`
        case DateFilter.Week:
            return `after:${getDateBefore(7)} before:${todayStr}`
        case DateFilter.Month:
            return `after:${getDateBefore(30)} before:${todayStr}`
        case DateFilter.ThreeMonths:
            return `after:${getDateBefore(90)} before:${todayStr}`
        case DateFilter.SixMonths:
            return `after:${getDateBefore(180)} before:${todayStr}`
        case DateFilter.Year:
            return `after:${getDateBefore(365)} before:${todayStr}`
        case DateFilter.Lifetime:
            return ''
        default:
            return ''
    }
}