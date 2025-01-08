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
import { Settings2, Search, ShieldCheck, ShieldOff, SparklesIcon, History, ExternalLink } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@radix-ui/themes'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { SearchType, SearchFilters } from '@/components/SearchBar'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from 'lucide-react'

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

interface Message {
    id: number
    content: string
    sender: 'user' | 'ai'
    timestamp: string
    type?: 'search' | 'refinement' | 'summary'
    relatedResults?: Post[]
}

const formatMessage = (content: string, relatedResults?: Post[]): React.ReactNode => {
    if (!content) return null;

    // Funzione per ottenere i risultati citati
    const getCitedResults = (citation: string): Post[] => {
        if (!relatedResults) return [];
        const numbers = citation.match(/\[(\d+)\]/g)?.map(n => parseInt(n.replace(/[\[\]]/g, '')) - 1) || [];
        return numbers.map(n => relatedResults[n]).filter(Boolean);
    };

    // Rimuove la punteggiatura dopo le citazioni
    const cleanContent = content.replace(/\[(\d+(?:,\s*\d+)*)\][.,]/g, '[$1]');

    // Processa il testo per il grassetto
    const processText = (text: string) => {
        return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Rimuove gli asterischi e applica il grassetto
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Divide il contenuto in sezioni basate sulle citazioni
    const parts = cleanContent.split(/(\[[0-9,\s]+\])/).map((part, index) => {
        // Se è una citazione
        if (part.match(/^\[[0-9,\s]+\]$/)) {
            const citedResults = getCitedResults(part);
            return (
                <div key={index} className="my-4">
                    <div className="grid gap-2">
                        {citedResults.map((result, idx) => (
                            <div 
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
                            >
                                <div className="flex-none mt-0.5">
                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                        {relatedResults?.indexOf(result)! + 1}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={result.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="font-medium hover:underline truncate flex-1"
                                        >
                                            {result.title}
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 flex-none"
                                            onClick={() => window.open(result.link, '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                                        {result.snippet}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        
        // Se è testo normale, processa per il grassetto
        return (
            <div key={index} className="prose dark:prose-invert max-w-none text-base leading-relaxed">
                {processText(part)}
            </div>
        );
    });

    return (
        <div className="space-y-1">
            {parts}
        </div>
    );
};

interface LoadingState {
    search: boolean
    aiQuery: boolean
    aiResponse: boolean
    loadMore: boolean
}

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
    const [privacyMode, setPrivacyMode] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAiMode, setIsAiMode] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [searchContext, setSearchContext] = useState<{
        currentTopic?: string
        relatedQueries: string[]
        searchChain: Message[]
    }>({
        relatedQueries: [],
        searchChain: []
    });
    
    useEffect(() => {
        // Only access localStorage on the client side
        const saved = window.localStorage.getItem('privacyMode');
        if (saved !== null) {
            setPrivacyMode(JSON.parse(saved));
        }
    }, []);
    
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
    const [loadingState, setLoadingState] = useState<LoadingState>({
        search: false,
        aiQuery: false,
        aiResponse: false,
        loadMore: false
    });

    // Aggiungo ref per lo scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
        if (searchInProgress) return;

        try {
            setSearchInProgress(true)
            setSearchResults([])
            setLoadingState(prev => ({ ...prev, search: true }))
            setCurrentPage(1)
            setHasMore(true)

            const queryToSearch = (queryToUse || searchQuery).trim()
            if (!queryToSearch) return

            // Add user message
            const userMessage: Message = {
                id: Date.now(),
                content: queryToSearch,
                sender: 'user',
                timestamp: new Date().toISOString(),
                type: 'search'
            }
            setMessages(prev => [...prev, userMessage]);
            setTimeout(() => scrollToMessage(userMessage.id), 100);

            if (isAiMode) {
                try {
                    // Set AI query loading state
                    setLoadingState(prev => ({ ...prev, aiQuery: true }))

                    const queryResponse = await fetch('/api/prompt', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${email}`
                        },
                        body: JSON.stringify({
                            systemPrompt: `You are a multilingual search expert specializing in finding specific content types.

Your task is to create precise search queries that find relevant results based on the content type requested.

IMPORTANT: Only modify the query if specific keywords are present:

1. For document/file searches:
   - ONLY add filetype operators when user explicitly mentions: pdf, doc, docx, xls, xlsx, csv, ppt, pptx, txt
   Example: "find python documentation pdf" -> "python documentation filetype:pdf"

2. For shopping/price related:
   - ONLY add exclusions when user mentions: buy, price, cost, purchase, shop
   Example: "buy new laptop" -> "buy new laptop -scam -fake"

3. For academic/research:
   - ONLY add site operators when user mentions: research papers, academic, scholarly, thesis
   Example: "research papers on AI" -> "research papers on AI site:scholar.google.com"

4. For all other queries:
   - Return the query EXACTLY as provided by the user
   Example: "best movies like Matrix" -> "best movies like Matrix"

Reply ONLY with the optimized query.`,
                            userPrompt: queryToSearch,
                            email: email
                        }),
                    });

                    setLoadingState(prev => ({ ...prev, aiQuery: false }))

                    if (queryResponse.ok) {
                        const { output: optimizedQuery } = await queryResponse.json();
                        
                        // Execute search with optimized query
                        const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
                        const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
                        
                        const finalQuery = buildSearchQuery(
                            optimizedQuery, 
                            siteToSearch, 
                            dateFilterString, 
                            newSearchType || searchType,
                            filters || searchFilters
                        )
                        
                        const Results = await fetchResults(finalQuery, 1)
                        setSearchResults(Results)
                        setHasResults(Results.length > 0)

                        if (Results.length > 0) {
                            // Set AI response loading state
                            setLoadingState(prev => ({ ...prev, aiResponse: true }))

                            const contextStr = Results.map((result, index) => 
                                `[${index + 1}] "${result.title}": ${result.snippet}`
                            ).join('\n\n');

                            const response = await fetch('/api/prompt', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${email}`
                                },
                                body: JSON.stringify({
                                    systemPrompt: `You are a multilingual assistant that provides information about content availability from legitimate sources.

Rules:
1. Focus on all sources 
2. Cite sources using [1], [2] immediately after mentioning each resource

Examples:

Good response:
"The research paper is available on arXiv [1] and Google Scholar [2]. The official documentation can be found on Python.org [3]."

Bad response:
"I found several download links and file sharing sites where you can get this content [1, 2]."

Keep responses focused on legitimate sources and official channels.`,
                                    userPrompt: `Original query: ${queryToSearch}\nOptimized query: ${optimizedQuery}\n\nSearch results:\n${contextStr}`,
                                    email: email
                                }),
                            });

                            setLoadingState(prev => ({ ...prev, aiResponse: false }))

                            if (response.ok) {
                                const data = await response.json();
                                const aiMessage: Message = {
                                    id: Date.now(),
                                    content: data.output,
                                    sender: 'ai',
                                    timestamp: new Date().toISOString(),
                                    type: 'summary',
                                    relatedResults: Results
                                }
                                setMessages(prev => [...prev, aiMessage]);
                                setTimeout(() => scrollToMessage(aiMessage.id), 100);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in AI processing:', error)
                    toast.error("AI processing failed. Falling back to normal search.")
                    performNormalSearch(queryToSearch, newSearchType, filters)
                } finally {
                    setLoadingState(prev => ({ ...prev, aiQuery: false, aiResponse: false }))
                }
            } else {
                await performNormalSearch(queryToSearch, newSearchType, filters)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            setHasResults(false)
            toast.error("Search failed. Please try again.")
        } finally {
            setLoadingState(prev => ({ ...prev, search: false }))
            setSearchInProgress(false)
        }
    }

    // Funzione helper per la ricerca normale
    const performNormalSearch = async (query: string, newSearchType?: SearchType, filters?: SearchFilters) => {
        // Check if this is a vision search
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
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to process image search');
                }

                const data = await response.json();
                
                // Convert vision results to search results format
                const Results = data.similarImages.map((img: any) => ({
                    title: 'Similar Image',
                    link: img.url,
                    snippet: `Similarity score: ${Math.round(img.score * 100)}%`,
                    media: {
                        type: 'image' as const,
                        url: img.url
                    }
                }));

                setSearchResults(Results);
                setHasResults(Results.length > 0);
                return;
            } catch (error) {
                console.error('Vision search error:', error);
                toast.error(error instanceof Error ? error.message : 'Vision search failed');
                return;
            }
        }

        // Normal search flow
        const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
        const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
        
        const finalQuery = buildSearchQuery(
            query, 
            siteToSearch, 
            dateFilterString, 
            newSearchType || searchType,
            filters || searchFilters
        )
        
        const Results = await fetchResults(finalQuery, 1)
        setSearchResults(Results)
        setHasResults(Results.length > 0)
    }

    const handleLoadMore = async () => {
        if (loadingState.loadMore || !hasMore) return;
        
        try {
            setLoadingState(prev => ({ ...prev, loadMore: true }));
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
            setLoadingState(prev => ({ ...prev, loadMore: false }));
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
                
                // If it's a vision search (image file provided), return the base query
                if (filters?.isImageSearch) {
                    return mediaQuery;
                }
                
                // Always search for videos only (removing image search options)
                mediaQuery += ` (
                    site:youtube.com OR site:vimeo.com OR site:dailymotion.com OR
                    site:twitch.tv OR filetype:mp4 OR filetype:webm OR filetype:mov OR
                    intext:"video" OR intext:"watch"
                )`;
                
                // Add filters to exclude non-video content
                mediaQuery += ` -site:youtube.com/channel -site:youtube.com/user -site:youtube.com/playlist`;
                
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

    // Aggiungo useEffect per scrollare quando cambiano i messaggi
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Modifico la gestione dello scroll
    const messageRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

    const scrollToMessage = (messageId: number) => {
        if (messageRefs.current[messageId]) {
            messageRefs.current[messageId]?.scrollIntoView({ 
                behavior: "smooth",
                block: "start"  // Scroll all'inizio del messaggio invece che alla fine
            });
        }
    };

    return (
        <main className="min-h-screen bg-background">
            <Header
                userId={userId}
                name={name}
                email={email}
                imageUrl={imageUrl}
                onLogout={handleLogout}
                subscriptionStatus={subscriptionStatus}
                subscriptionPlan={subscriptionPlan}
            />

            <div className="max-w-4xl mx-auto px-4">
                {/* Search Input */}
                <div className="sticky top-0 pb-4 bg-background/95 backdrop-blur-lg z-50 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {/* Remove loading indicator section */}
                        </div>
                    </div>
                    <SearchBar
                        onSearch={handleSearch}
                        typingQuery={searchQuery}
                        setTypingQuery={(query) => {
                            setSearchQuery(query)
                            // Reset messages when user types a new query
                            setMessages([])
                        }}
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
                        isAiMode={isAiMode}
                        onAiModeChange={setIsAiMode}
                        messages={messages}
                        onClearChat={() => setMessages([])}
                        userInfo={email ? {
                            name,
                            email,
                        } : undefined}
                    />
                </div>

                {/* Content Area */}
                {isAiMode ? (
                    <div className="py-6">
                        {messages.length === 0 ? (
                            <div className="text-center py-5">
                               
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto px-4 mb-8">
                                    <div className="p-4 rounded-lg border bg-card">
                                        <h4 className="font-medium mb-2">Find Informations</h4>
                                        <p className="text-sm text-muted-foreground mb-2">Search for research papers, articles, tutorials, and general information</p>
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium italic animate-fade-in-out">
                                            "latest research on quantum computing"
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <h4 className="font-medium mb-2">Search Documents</h4>
                                        <p className="text-sm text-muted-foreground mb-2">Find specific file types like PDFs, CSVs, presentations, and more</p>
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium italic animate-fade-in-out">
                                            "find 1984 book in pdf"
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <h4 className="font-medium mb-2">Make Bookings</h4>
                                        <p className="text-sm text-muted-foreground mb-2">Book restaurants, flights, hotels, and more</p>
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium italic animate-fade-in-out">
                                            "book a table at Italian restaurant in San Francisco"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Show only the last AI message */}
                                {messages.length > 0 && messages[messages.length - 1].sender === 'ai' && (
                                    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                                        {formatMessage(messages[messages.length - 1].content, messages[messages.length - 1].relatedResults)}
                                    </div>
                                )}
                                {(loadingState.search || loadingState.aiQuery || loadingState.aiResponse) && (
                                    <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                                        <div className="h-4 w-4 relative">
                                            <div className="absolute inset-0 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <span className="text-sm">
                                            {loadingState.aiQuery 
                                                ? "Optimizing search query..." 
                                                : loadingState.aiResponse 
                                                    ? "Analyzing results..." 
                                                    : "Searching..."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-6">
                        {loadingState.search ? (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Searching...</span>
                            </div>
                        ) : hasResults ? (
                            <SearchResults
                                platform={selectedSite}
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
                                isLoadingMore={loadingState.loadMore}
                                setCustomUrl={setCustomUrl}
                                setSelectedSite={setSelectedSite}
                                handleSearch={handleSearch}
                                credits={credits}
                                onCreditUpdate={handleCreditUpdate}
                                searchType={searchType}
                            />
                        ) : searchQuery && (
                            <div className="text-center py-20 text-muted-foreground">
                                {searchQuery.toLowerCase().includes('what is lexy') || searchQuery.toLowerCase().includes('about lexy') ? (
                                    <div className="max-w-2xl mx-auto space-y-4">
                                        <h3 className="text-lg font-semibold text-foreground">About Lexy</h3>
                                        <p>Lexy is an AI-powered search and analysis tool that helps you find and understand information more effectively. With Lexy, you can:</p>
                                        <ul className="space-y-2 text-sm">
                                            <li>• Search across multiple platforms and sources</li>
                                            <li>• Get AI-powered summaries and insights</li>
                                            <li>• Analyze documents and web content</li>
                                            <li>• Find specific file types (PDFs, documents, etc.)</li>
                                            <li>• Make travel and dining bookings</li>
                                        </ul>
                                        <p className="text-sm mt-4">
                                            Lexy combines powerful search capabilities with AI to help you find exactly what you're looking for and understand it better.
                                        </p>
                                    </div>
                                ) : (
                                    <div>No results found for "{searchQuery}"</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out forwards;
                }
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                .animate-fade-in-out {
                    animation: fadeInOut 4s ease-in-out infinite;
                }
            `}</style>
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