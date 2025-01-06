'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { toast, Toaster } from "sonner"
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, Timestamp, getDoc } from 'firebase/firestore'
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
import { Settings2, Search, ShieldCheck, ShieldOff, SparklesIcon, History } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@radix-ui/themes'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { SearchType, SearchFilters } from '@/components/SearchBar'

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
    media?: {
        type: 'video' | 'image'
        url?: string
        platform?: string
        videoId?: string
        embedUrl?: string
        thumbnailUrl?: string
    }
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

interface SearchUIProps {
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

export default function SearchTab({ Membership = '', name = '', email = '', userId = '', imageUrl = '' }: SearchUIProps) {
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
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
    const [privacyMode, setPrivacyMode] = useState(() => {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('privacyMode')
        return saved ? JSON.parse(saved) : false
    });
    const RESULTS_PER_PAGE = 10; // Constant for number of results per page
    const [credits, setCredits] = useState(0)
    const [typingQuery, setTypingQuery] = useState('')
    const [hasResults, setHasResults] = useState(false)
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>()
    const [subscriptionPlan, setSubscriptionPlan] = useState<string>()
    const { scrollY } = useScroll()
    const [isScrolled, setIsScrolled] = useState(false)
    const [settingsButtonRef, setSettingsButtonRef] = useState<HTMLButtonElement | null>(null);
    const [searchInProgress, setSearchInProgress] = useState(false)
    const initialSearchRef = useRef(false)
    const urlTriggeredRef = useRef(false)
    const [showBetaDialog, setShowBetaDialog] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([])
    const [isHistoryLoading, setIsHistoryLoading] = useState(false)

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

                // Update subscription data
                setSubscriptionStatus(userData.subscriptionStatus)
                setSubscriptionPlan(userData.subscriptionPlan)

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

    // Update the fetchResults function to handle Google pagination
    const fetchResults = async (query: string, page: number): Promise<Post[]> => {
        try {
            // Calculate the start index for Google pagination (0-based)
            const start = (page - 1) * RESULTS_PER_PAGE;
            
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    start: start
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // If no results are returned, mark as no more results
                if (data.data.length === 0) {
                    setHasMore(false);
                }
                return data.data;
            } else {
                throw new Error(data.error || 'Unknown API error occurred');
            }
        } catch (error: any) {
            console.error('Error fetching results:', error.message || error);
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
        let query = getSearchTypeQuery(type, baseQuery, filters);
        
        // Add file type filter if selected and in web search mode
        if (type === 'web' && selectedFileType !== 'all') {
            const fileTypeDork = fileTypes.find(ft => ft.value === selectedFileType)?.dork || '';
            if (fileTypeDork) {
                query += ` ${fileTypeDork}`;
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

    const handleCreditUpdate = useCallback(async () => {
        if (!email) return;
        
        try {
            const userDocRef = doc(db, 'users', email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setCredits(userDoc.data().credits || 0);
            }
        } catch (error) {
            console.error('Error updating credits:', error);
        }
    }, [email]);

    const handleSearch = async (queryToUse?: string, newSearchType?: SearchType, filters?: SearchFilters) => {
        if (searchInProgress) {
            console.log('Search already in progress, skipping...')
            return
        }

        // Check credits for social search
        if ((newSearchType === 'social' || searchType === 'social') && credits <= 0) {
            toast.error(
                "You're out of credits!",
                {
                    description: (
                        <div className="flex items-center gap-1">
                            <span>Upgrade to </span>
                            <button
                                onClick={() => window.location.href = '/subscription'}
                                className="font-medium text-purple-500 hover:text-purple-600 underline underline-offset-2"
                            >
                                get 50 daily credits
                            </button>
                        </div>
                    ),
                }
            );
            return;
        }

        try {
            setSearchInProgress(true)
            setSearchResults([])
            setLoading(true)
            setCurrentPage(1)
            setHasMore(true)

            if (newSearchType) {
                setSearchType(newSearchType)
            }
            if (filters) {
                setSearchFilters(filters)
            }

            // Handle image search
            if (filters?.isImageSearch && filters.image) {
                try {
                    const response = await fetch('/api/image-search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            image: filters.image,
                            email: email
                        })
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            toast.error("You're out of credits!", {
                                description: (
                                    <div className="flex items-center gap-1">
                                        <span>Upgrade to </span>
                                        <button
                                            onClick={() => window.location.href = '/subscription'}
                                            className="font-medium text-purple-500 hover:text-purple-600 underline underline-offset-2"
                                        >
                                            get 50 daily credits
                                        </button>
                                    </div>
                                ),
                            });
                        } else {
                            throw new Error('Failed to process image search');
                        }
                        return;
                    }

                    const data = await response.json();
                    if (data.similarImages) {
                        // Convert the image search results to the Post format
                        const results = data.similarImages.map((img: any) => ({
                            title: 'Similar Image',
                            link: img.url,
                            snippet: `Similarity score: ${Math.round((img.score || 0) * 100)}%`,
                            media: {
                                type: 'image',
                                url: img.url
                            }
                        }));

                        // Filter out problematic domains
                        const filteredResults = results.filter((result: Post) => {
                            const url = result.media?.url?.toLowerCase() || '';
                            const problematicDomains = [
                                'media.licdn.com',
                                'dims.apnews.com',
                                'lookaside.instagram.com',
                                'imageio.forbes.com',
                                'm.media-amazon.com',
                                'hips.hearstapps.com'
                            ];
                            
                            // Check if URL contains any problematic domain
                            return !problematicDomains.some(domain => url.includes(domain));
                        });

                        setSearchResults(filteredResults);
                        setHasResults(filteredResults.length > 0);
                        // Update credits after successful search
                        handleCreditUpdate();
                    } else {
                        throw new Error('No results found');
                    }
                    return;
                } catch (error) {
                    console.error('Error in image search:', error);
                    toast.error('Failed to process image search');
                    return;
                }
            }

            // Regular search logic continues here...
            const queryToSearch = (queryToUse || searchQuery).trim()
            if (!queryToSearch) return

            if (!urlTriggeredRef.current) {
                await trackSearchQuery(queryToSearch)
            }
            
            const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
            const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
            
            const finalQuery = buildSearchQuery(
                queryToSearch, 
                siteToSearch, 
                dateFilterString, 
                newSearchType || searchType,
                filters || searchFilters
            )
            
            const Results = await fetchResults(finalQuery, 1)
            setSearchResults(Results)
            setHasResults(Results.length > 0)

            // Deduct credit for social search
            if ((newSearchType === 'social' || searchType === 'social') && email) {
                const userDocRef = doc(db, 'users', email);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const currentCredits = userDoc.data().credits || 0;
                    if (currentCredits > 0) {
                        await updateDoc(userDocRef, { credits: currentCredits - 1 });
                        handleCreditUpdate();
                    }
                }
            }

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
                setSearchResults(prev => [...prev, ...newResults]);
                setCurrentPage(nextPage);
            }
        } catch (error) {
            console.error('Error loading more results:', error);
            toast.error('Failed to load more results. Please try again.');
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

    // Solo per nuovi risultati di ricerca
    useEffect(() => {
        if (hasResults && currentPage === 1) {
            scrollToTop();
        }
    }, [hasResults, currentPage]);

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
    const isInitialMount = useRef(true)

    useEffect(() => {
        const query = searchParams?.get('q')
        
        // Only proceed if we have a query and it's the initial mount
        if (query && isInitialMount.current) {
            isInitialMount.current = false
            urlTriggeredRef.current = true
            setSearchQuery(query)
            setTypingQuery(query)
            handleSearch(query)
        }
    }, [searchParams])

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

    const getSearchTypeQuery = (type: SearchType, baseQuery: string, filters?: SearchFilters): string => {
        switch (type) {
            case 'media':
                let mediaQuery = baseQuery;
                
                // Aggiungi filtri per tipo di contenuto se specificato
                if (filters?.contentType && filters.contentType !== 'all') {
                    if (filters.contentType === 'videos') {
                        mediaQuery += ` (site:youtube.com OR site:vimeo.com OR site:dailymotion.com OR site:twitch.tv OR filetype:mp4 OR filetype:webm OR filetype:mov OR intext:"video" OR intext:"watch")`;
                    } else if (filters.contentType === 'images') {
                        mediaQuery += ` (site:flickr.com OR site:imgur.com OR site:500px.com OR site:deviantart.com OR site:behance.net OR site:unsplash.com OR filetype:jpg OR filetype:jpeg OR filetype:png OR filetype:gif OR intext:"photo" OR intext:"image")`;
                    }
                } else {
                    // Query bilanciata per tutti i tipi di contenuti
                    mediaQuery += ` (
                        site:flickr.com OR site:imgur.com OR site:500px.com OR 
                        site:unsplash.com OR site:pexels.com OR site:pixabay.com OR
                        site:youtube.com OR site:vimeo.com OR site:dailymotion.com OR
                        site:twitch.tv OR site:behance.net OR site:artstation.com OR
                        site:giphy.com OR site:tenor.com OR
                        filetype:jpg OR filetype:jpeg OR filetype:png OR filetype:gif OR 
                        filetype:mp4 OR filetype:webm OR filetype:mov OR
                        intext:"photo" OR intext:"image" OR intext:"video" OR intext:"watch" OR
                        intext:"gallery" OR intext:"portfolio"
                    )`;
                    
                    // Aggiungi filtri per escludere risultati eccessivi da YouTube
                    mediaQuery += ` -site:youtube.com/channel -site:youtube.com/user -site:youtube.com/playlist`;
                }
                
                return mediaQuery;
            case 'social':
                let query = baseQuery;
                
                // Add platform-specific filters
                if (filters?.platform && filters.platform !== 'all') {
                    switch (filters.platform) {
                        case 'twitter':
                            query += ' (site:twitter.com OR site:x.com)';
                            break;
                        case 'linkedin':
                            query += ' site:linkedin.com';
                            break;
                        case 'facebook':
                            query += ' site:facebook.com';
                            break;
                        case 'instagram':
                            query += ' site:instagram.com';
                            break;
                        case 'tiktok':
                            query += ' site:tiktok.com';
                            break;
                        case 'reddit':
                            query += ' site:reddit.com';
                            break;
                    }
                } else {
                    query += ' (site:twitter.com OR site:x.com OR site:linkedin.com OR site:facebook.com OR site:instagram.com OR site:tiktok.com OR site:reddit.com)';
                }

                // Add content type filters
                if (filters?.contentType && filters.contentType !== 'all') {
                    switch (filters.contentType) {
                        case 'posts':
                            query += ' (inurl:post OR inurl:status OR inurl:p OR intext:"posted" OR intext:"shared")';
                            break;
                        case 'profiles':
                            query += ' (inurl:profile OR inurl:user OR inurl:u OR intext:"profile" OR intext:"bio")';
                            break;
                        case 'discussions':
                            query += ' (inurl:comments OR inurl:discussion OR intext:"commented" OR intext:"replied")';
                            break;
                    }
                }

                // Add additional filters
                if (filters?.includeContacts) {
                    query += ' (intext:email OR intext:mail OR intext:@ OR intext:phone OR intext:tel OR intext:contact)';
                }
                if (filters?.includeHashtags) {
                    query += ' (intext:hashtag OR intext:#)';
                }
                if (filters?.includeMentions) {
                    query += ' (intext:@)';
                }
                if (filters?.includeComments) {
                    query += ' (intext:comment OR intext:reply OR intext:responded)';
                }

                return query;
            default:
                return baseQuery;
        }
    }

    const fetchSearchHistory = async () => {
        setIsHistoryLoading(true)
        if (!email) {
            const localHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]')
            setSearchHistory(localHistory)
            setIsHistoryLoading(false)
            return
        }

        try {
            const response = await fetch('/api/search-history', {
                headers: {
                    'email': email
                }
            })
            const data = await response.json()
            if (data.success) {
                setSearchHistory(data.data)
            }
        } catch (error) {
            console.error('Error fetching search history:', error)
            toast.error("Failed to load search history")
        } finally {
            setIsHistoryLoading(false)
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
                subscriptionStatus={subscriptionStatus}
                subscriptionPlan={subscriptionPlan}
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
                                    setSearchFilters({});
                                }}
                                showHistory={true}
                                onHistoryClick={() => {
                                    fetchSearchHistory()
                                    setShowHistoryModal(true)
                                }}
                                showSettings={true}
                                isScrolled={isScrolled}
                            />
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
                            setSearchFilters({});
                        }}
                        showHistory={true}
                        onHistoryClick={() => {
                            fetchSearchHistory()
                            setShowHistoryModal(true)
                        }}
                        showSettings={true}
                        isScrolled={isScrolled}
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
                        searchType={searchType}
                    />
                )}
            </motion.div>

            {/* Add the History Modal */}
            <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Search History
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {isHistoryLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : searchHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No search history found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {searchHistory
                                    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp in descending order
                                    .map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{item.query}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                setShowHistoryModal(false)
                                                handleSearch(item.query)
                                            }}
                                        >
                                            Search Again
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
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