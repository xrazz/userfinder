'use client'

import React, { useEffect, useState, useCallback, useRef, ChangeEvent } from 'react'
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Settings2, Search, ShieldCheck, ShieldOff, SparklesIcon, History, ExternalLink, FileText, BookOpen, Code2, GraduationCap, Presentation, FileSpreadsheet, Share2, ImageIcon, ThumbsUp, ThumbsDown, Hash, Bookmark, MessageSquare, Globe, Calendar } from 'lucide-react'
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

// Update firebaseAnalytics interface
declare module '@/app/firebaseClient' {
    interface FirebaseAnalytics {
        logPageView: (pagePath: string) => void;
        logEvent: (eventName: string, eventParams?: any) => void;
    }
}

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
    isSaved?: boolean
    onSave?: () => void
}

interface SavedResponse {
    id: string
    content: string
    timestamp: number
    topics: string[]
    query: string
    results?: Post[]
}

interface FeedbackData {
    responseId: string
    isHelpful: boolean
    timestamp: number
    userId?: string
    query: string
    userQuery: string
}

interface DiscussionData {
    id: string
    responseId: string
    title: string
    content: string
    timestamp: number
    userId?: string
    replies: number
}

// Add back the LoadingState interface
interface LoadingState {
    search: boolean
    aiQuery: boolean
    aiResponse: boolean
    loadMore: boolean
}

// Extract key topics from the content
const extractTopics = (text: string): string[] => {
    const topics = new Set<string>();
    const boldMatches = text.match(/\*\*(.*?)\*\*/g) || [];
    boldMatches.forEach(match => {
        topics.add(match.replace(/\*\*/g, '').toLowerCase());
    });
    return Array.from(topics).slice(0, 5); // Return top 5 topics
};

// Convert formatMessage to a React component
const MessageContent: React.FC<{
    content: string;
    relatedResults?: Post[];
    onSearch?: (query: string) => void;
    email?: string;
    query?: string;
    searchQuery?: string;
}> = ({ content, relatedResults, onSearch, email, query, searchQuery }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
    const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
    const [discussionTitle, setDiscussionTitle] = useState('');
    const [discussionContent, setDiscussionContent] = useState('');

    // Process text for bold formatting
    const processText = (text: string) => {
        return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Extract key topics from the content
    const extractTopicsLocal = (text: string): string[] => {
        const topics = new Set<string>();
        const boldMatches = text.match(/\*\*(.*?)\*\*/g) || [];
        boldMatches.forEach(match => {
            topics.add(match.replace(/\*\*/g, '').toLowerCase());
        });
        return Array.from(topics).slice(0, 5); // Return top 5 topics
    };

    // Handler for saving responses
    const handleSaveResponse = async () => {
        if (!email) {
            toast.error("Please sign in to save responses", {
                description: "Create an account to access all features",
                action: {
                    label: "Sign In",
                    onClick: () => window.location.href = '/login'
                }
            });
            return;
        }

        try {
            const savedResponse: SavedResponse = {
                id: Date.now().toString(),
                content,
                timestamp: Date.now(),
                topics: extractTopics(content),
                query: query || '',
                results: relatedResults
            };

            // Save to Firestore
            const userDocRef = doc(db, 'users', email);
            const savedResponsesRef = collection(userDocRef, 'savedResponses');
            await addDoc(savedResponsesRef, savedResponse);

            setIsSaved(true);
            toast.success("Response saved!", {
                description: "You can find it in your saved items"
            });
        } catch (error) {
            console.error('Error saving response:', error);
            toast.error("Failed to save response");
        }
    };

    // Handler for feedback
    const handleFeedback = async (isHelpful: boolean) => {
        if (feedbackGiven) return;

        try {
            const feedback: FeedbackData = {
                responseId: Date.now().toString(),
                isHelpful,
                timestamp: Date.now(),
                query: query || searchQuery || '', // AI's response
                userQuery: searchQuery || '', // User's original query
                ...(email && { userId: email })
            };

            // Save feedback to Firestore
            const feedbackRef = collection(db, 'feedback');
            await addDoc(feedbackRef, feedback);

            setFeedbackGiven(isHelpful ? 'up' : 'down');
            toast.success("Thank you for your feedback!");

            // Track analytics
            firebaseAnalytics.logEvent('response_feedback', {
                isHelpful,
                query: query || searchQuery || '',
                userQuery: searchQuery || ''
            });
        } catch (error) {
            console.error('Error saving feedback:', error);
            toast.error("Failed to save feedback");
        }
    };

    // Handler for starting discussions
    const handleStartDiscussion = async () => {
        if (!email) {
            toast.error("Please sign in to start discussions", {
                description: "Create an account to access all features",
                action: {
                    label: "Sign In",
                    onClick: () => window.location.href = '/login'
                }
            });
            return;
        }

        setIsDiscussionOpen(true);
    };

    // Handler for submitting discussions
    const handleSubmitDiscussion = async () => {
        if (!discussionTitle.trim() || !discussionContent.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            const discussion: DiscussionData = {
                id: Date.now().toString(),
                responseId: Date.now().toString(),
                title: discussionTitle,
                content: discussionContent,
                timestamp: Date.now(),
                userId: email,
                replies: 0
            };

            // Save to Firestore
            const discussionsRef = collection(db, 'discussions');
            await addDoc(discussionsRef, discussion);

            setIsDiscussionOpen(false);
            toast.success("Discussion started!", {
                description: "Others can now join the conversation"
            });

            // Track analytics
            firebaseAnalytics.logEvent('discussion_created', {
                query: query || ''
            });
        } catch (error) {
            console.error('Error creating discussion:', error);
            toast.error("Failed to create discussion");
        }
    };

    // Function to get cited results
    const getCitedResults = (citation: string): Post[] => {
        if (!relatedResults) return [];
        const numbers = citation.match(/\[(\d+)\]/g)?.map(n => parseInt(n.replace(/[\[\]]/g, '')) - 1) || [];
        return numbers.map(n => relatedResults[n]).filter(Boolean);
    };

    // Extract follow-up questions if they exist
    const sections = content.split(/\n(?=(?:Main Answer|Key Details|Additional Context|Follow-up Questions):)/);
    const followUpSection = sections.find(section => section.trim().startsWith('Follow-up Questions:'));
    const followUpQuestions = followUpSection
        ? followUpSection
            .replace('Follow-up Questions:', '')
            .trim()
            .split('\n')
            .filter(q => q.trim())
            .map(q => q.replace(/^[•-]\s*/, '').trim())
        : [];

    // Clean up markdown formatting and HTML tags
    const cleanContent = content
        .replace(/\[(\d+(?:,\s*\d+)*)\][.,]/g, '[$1]') // Remove punctuation after citations
        .replace(/\n---\s*Follow-up Questions:[\s\S]*$/, ''); // Remove old follow-up questions section if exists

    // Split content into sections based on citations
    const parts = cleanContent.split(/(\[[0-9,\s]+\])/).map((part, index) => {
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
        
        return (
            <div key={index} className="prose dark:prose-invert max-w-none text-base leading-relaxed">
                {processText(part)}
            </div>
        );
    });

    // Extract topics for the knowledge graph
    const topics = extractTopics(cleanContent);

    return (
        <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-1">
                {parts}
            </div>

            {/* Engagement Features */}
            <div className="mt-8 space-y-6">
                {/* Interactive Feedback */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="text-sm text-muted-foreground">Was this response helpful?</div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`gap-2 ${feedbackGiven === 'up' ? 'bg-green-100 text-green-700' : ''}`}
                            onClick={() => handleFeedback(true)}
                            disabled={feedbackGiven !== null}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            Yes
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`gap-2 ${feedbackGiven === 'down' ? 'bg-red-100 text-red-700' : ''}`}
                            onClick={() => handleFeedback(false)}
                            disabled={feedbackGiven !== null}
                        >
                            <ThumbsDown className="w-4 h-4" />
                            No
                        </Button>
                    </div>
                </div>

                {/* Follow-up Questions */}
                {followUpQuestions.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            Explore Further
                        </h4>
                        <div className="grid gap-2">
                            {followUpQuestions.map((question, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="justify-start text-left h-auto py-2 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() => {
                                        if (onSearch) {
                                            onSearch(question);
                                        } else {
                                            const searchBar = document.querySelector('input[type="text"]') as HTMLInputElement;
                                            if (searchBar) {
                                                searchBar.value = question;
                                                searchBar.dispatchEvent(new Event('input', { bubbles: true }));
                                                searchBar.focus();
                                            }
                                        }
                                    }}
                                >
                                    <span className="line-clamp-2">{question}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Knowledge Graph */}
                {topics.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Related Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {topics.map((topic, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => onSearch?.(topic)}
                                >
                                    <Hash className="w-3 h-3" />
                                    {topic}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Replace formatMessage with a wrapper that uses the new component
const formatMessage = (
    content: string, 
    relatedResults?: Post[], 
    onSearch?: (query: string) => void,
    email?: string,
    query?: string,
    searchQuery?: string
): React.ReactNode => {
    if (!content) return null;
    return (
        <MessageContent
            content={content}
            relatedResults={relatedResults}
            onSearch={onSearch}
            email={email}
            query={query}
            searchQuery={searchQuery}
        />
    );
};

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
                    let creditsToSet = 10;  // Default to Free tier credits

                    // Normalize membership level to handle different cases
                    const normalizedLevel = membershipLevel.toLowerCase();
                    if (normalizedLevel === 'free') {
                        creditsToSet = 10;
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

    // Update the fetchResults function to handle empty results better
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
                // If no results are returned, try to understand why
                if (!data.data || data.data.length === 0) {
                    console.log('No results found for query:', query);
                    // If it's the first page, show a more helpful message
                    if (page === 1) {
                        toast.error("No results found", {
                            description: "Try adjusting your search terms or removing some filters",
                        });
                    }
                    setHasMore(false);
                }
                return data.data || [];
            } else {
                throw new Error(data.error || 'Unknown API error occurred');
            }
        } catch (error: any) {
            console.error('Error fetching results:', error.message || error);
            toast.error("Search failed", {
                description: error.message || "Please try again with different search terms",
            });
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

    // Add this helper function to handle URL parameters
    const updateUrlParams = (params: {
        q?: string,
        type?: SearchType,
        fileType?: string,
        filter?: string,
        site?: string,
        aiMode?: boolean
    }) => {
        // Simply update the URL to '/' without any parameters
        const newUrl = '/';
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    // Add this function to sync state from URL parameters
    const syncStateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        
        // Get all parameters
        const query = params.get('q');
        const type = params.get('type') as SearchType;
        const fileType = params.get('fileType');
        const filter = params.get('filter');
        const site = params.get('site');
        const aiMode = params.get('aiMode');
        
        // Update state only if parameters exist
        if (query) {
            setSearchQuery(query);
            setTypingQuery(query);
        }
        
        if (type && ['web', 'media', 'social'].includes(type)) {
            setSearchType(type);
        }
        
        if (fileType) {
            setSelectedFileType(fileType);
        }
        
        if (filter) {
            setCurrentFilter(filter);
        }
        
        if (site) {
            setSelectedSite(site);
        }
        
        if (aiMode !== null) {
            setIsAiMode(aiMode === 'true');
        }
    };

    // Update the handleSearch function
    const handleSearch = async (queryToUse?: string, newSearchType?: SearchType, filters?: SearchFilters) => {
        if (searchInProgress) return;

        try {
            setSearchInProgress(true);
            setSearchResults([]);
            setLoadingState((prev: LoadingState) => ({ ...prev, search: true }));
            setCurrentPage(1);
            setHasMore(true);

            // Update URL with all search parameters
            const queryToSearch = (queryToUse || searchQuery).trim();
            if (queryToSearch) {
                updateUrlParams({
                    q: queryToSearch,
                    type: newSearchType || searchType,
                    fileType: selectedFileType,
                    filter: currentFilter,
                    site: selectedSite !== 'Universal search' ? selectedSite : undefined,
                    aiMode: isAiMode
                });
            }

            // Handle image search
            if (filters?.isImageSearch && filters.image) {
                if (!email) {
                    toast.error("Authentication required", {
                        description: "Please sign in to use image search.",
                    });
                    return;
                }

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

                    const data = await response.json();

                    if (!response.ok) {
                        if (response.status === 403) {
                            toast.error("Insufficient credits", {
                                description: "Please upgrade your plan to continue using image search.",
                            });
                        } else {
                            toast.error("Image search failed", {
                                description: data.error || "Please try again.",
                            });
                        }
                        return;
                    }

                    if (!data.similarImages || data.similarImages.length === 0) {
                        toast.error("No results found", {
                            description: "No similar images were found. Try a different image.",
                        });
                        return;
                    }

                    // Transform the results into the Post format
                    const imageResults: Post[] = data.similarImages.map((img: any) => ({
                        title: "Similar Image",
                        link: img.url,
                        snippet: "Visually similar image found",
                        media: {
                            type: 'image',
                            url: img.url
                        }
                    }));

                    setSearchResults(imageResults);
                    setHasResults(imageResults.length > 0);
                    
                    // Update credits after successful search
                    handleCreditUpdate();
                    
                    return;
                } catch (error) {
                    console.error('Error in image search:', error);
                    toast.error("Image search failed", {
                        description: "Please try again later.",
                    });
                    return;
                }
            }

            // Rest of the existing search logic...
            if (!queryToSearch) return;

            // Only track text search queries, not media searches
            if (!filters?.isImageSearch) {
                await trackSearchQuery(queryToSearch);
            }

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
                    setLoadingState((prev: LoadingState) => ({ ...prev, aiQuery: true }))

                    // Prepare conversation context from previous messages
                    const conversationContext = messages
                        .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
                        .join('\n\n');

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
                            email: email,
                            context: conversationContext // Add conversation context
                        }),
                    });

                    setLoadingState((prev: LoadingState) => ({ ...prev, aiQuery: false }))

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
                            setLoadingState((prev: LoadingState) => ({ ...prev, aiResponse: true }))

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
                                    systemPrompt: `You are a multilingual assistant that provides information about content availability from all the sources.

Rules:
1. Focus on all sources 
2. Cite sources using [1], [2] immediately after mentioning each resource
3. After your main response, add a section with 3-4 relevant follow-up questions
4. IMPORTANT: Use the conversation context to maintain continuity in your responses
5. Focus on all sources by:

Presenting their key findings or content
Comparing methodologies and approaches
Highlighting agreements and disagreements
Noting unique insights from each source

Format:
1. Main response with citations
2. Add a separator "---"
3. Add "Follow-up Questions:" followed by one question per line, each prefixed with "•"

Example:

The research paper is available on arXiv [1] and Google Scholar [2]. The official documentation can be found on Python.org [3].

---
Follow-up Questions:
• What are the key findings from the arXiv paper?
• Are there any alternative implementations discussed in the documentation?
• What are the system requirements mentioned in the paper?
• How does this compare to related research in the field?

Keep responses focused on legitimate sources and official channels.`,
                                    userPrompt: `Previous conversation:\n${conversationContext}\n\nOriginal query: ${queryToSearch}\nOptimized query: ${optimizedQuery}\n\nSearch results:\n${contextStr}`,
                                    email: email
                                }),
                            });

                            setLoadingState((prev: LoadingState) => ({ ...prev, aiResponse: false }))

                            if (response.ok) {
                                const data = await response.json();
                                const aiMessage: Message = {
                                    id: Date.now(),
                                    content: data.output,
                                    sender: 'ai',
                                    timestamp: new Date().toISOString(),
                                    type: 'summary',
                                    relatedResults: Results,
                                    isSaved: false,
                                    onSave: async () => {
                                        if (!email) {
                                            toast.error("Please sign in to save responses", {
                                                description: "Create an account to access all features",
                                                action: {
                                                    label: "Sign In",
                                                    onClick: () => window.location.href = '/login'
                                                }
                                            });
                                            return;
                                        }

                                        try {
                                            const savedResponse: SavedResponse = {
                                                id: Date.now().toString(),
                                                content: data.output,
                                                timestamp: Date.now(),
                                                topics: extractTopics(data.output),
                                                query: searchQuery || '',
                                                results: Results
                                            };

                                            // Save to Firestore
                                            const userDocRef = doc(db, 'users', email);
                                            const savedResponsesRef = collection(userDocRef, 'savedResponses');
                                            await addDoc(savedResponsesRef, savedResponse);

                                            // Update the message's isSaved state
                                            setMessages(prev => prev.map(msg => 
                                                msg.id === aiMessage.id 
                                                    ? { ...msg, isSaved: true }
                                                    : msg
                                            ));

                                            toast.success("Response saved!", {
                                                description: "You can find it in your saved items"
                                            });
                                        } catch (error) {
                                            console.error('Error saving response:', error);
                                            toast.error("Failed to save response");
                                        }
                                    }
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
                    setLoadingState((prev: LoadingState) => ({ ...prev, aiQuery: false, aiResponse: false }))
                }
            } else {
                await performNormalSearch(queryToSearch, newSearchType, filters)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            setHasResults(false)
            toast.error("Search failed. Please try again.")
        } finally {
            setLoadingState((prev: LoadingState) => ({ ...prev, search: false }))
            setSearchInProgress(false)
        }
    }

    // Update performNormalSearch to handle empty results better
    const performNormalSearch = async (query: string, newSearchType?: SearchType, filters?: SearchFilters) => {
        try {
            const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
            const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite === 'Universal search' ? '' : selectedSite
            
            // Log the search parameters for debugging
            console.log('Search parameters:', {
                query,
                siteToSearch,
                dateFilterString,
                searchType: newSearchType || searchType,
                filters: filters || searchFilters
            });
            
            const finalQuery = buildSearchQuery(
                query, 
                siteToSearch, 
                dateFilterString, 
                newSearchType || searchType,
                filters || searchFilters
            )
            
            // Log the final query for debugging
            console.log('Final query:', finalQuery);
            
            const Results = await fetchResults(finalQuery, 1)
            
            if (Results.length === 0) {
                // If we have filters applied, suggest removing them
                if (siteToSearch || dateFilterString !== 'all' || selectedFileType !== 'all') {
                    toast.error("No results found with current filters", {
                        description: "Try removing some filters to see more results",
                        action: {
                            label: "Clear Filters",
                            onClick: () => {
                                setSelectedSite('Universal search');
                                setCurrentFilter('all');
                                setSelectedFileType('all');
                                handleSearch(query);
                            }
                        }
                    });
                }
            }
            
            setSearchResults(Results)
            setHasResults(Results.length > 0)
        } catch (error) {
            console.error('Error in performNormalSearch:', error);
            toast.error("Search failed", {
                description: "Please try again with different search terms",
            });
        }
    }

    const handleLoadMore = async () => {
        if (loadingState.loadMore || !hasMore) return;
        
        try {
            setLoadingState((prev: LoadingState) => ({ ...prev, loadMore: true }));
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
            setLoadingState((prev: LoadingState) => ({ ...prev, loadMore: false }));
        }
    };

    const handleFilterChange = (value: string) => {
        setCurrentFilter(value);
        updateUrlParams({ filter: value });
        
        if (searchQuery.trim()) {
            handleSearch(searchQuery);
        }
    };

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
        updateUrlParams({ fileType: value });
        
        // Only trigger a new search if there's an active search query and it's not the first search
        if (searchQuery.trim() && initialSearchRef.current) {
            handleSearch(searchQuery);
        }
    }

    // Update the useEffect for URL-based search
    useEffect(() => {
        // Sync state from URL on initial load and URL changes
        syncStateFromUrl();
        
        // Perform search if we have a query
        const query = searchParams?.get('q');
        if (query && !searchInProgress) {
            handleSearch(query);
        }
    }, [searchParams]);

    // Add popstate event listener to handle browser back/forward
    useEffect(() => {
        const handlePopState = () => {
            syncStateFromUrl();
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

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
                        }}
                        onFileTypeChange={handleFileTypeChange}
                        selectedFileType={selectedFileType}
                        fileTypes={fileTypes}
                        searchType={searchType}
                        onSearchTypeChange={(type) => {
                            setSearchType(type);
                            setSearchFilters({});
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
                            isPro: subscriptionPlan === 'Pro'
                        } : undefined}
                    />
                </div>

                {/* Content Area */}
                {isAiMode ? (
                    <div className="py-6">
                        {messages.length === 0 ? (
                            <div className="text-center py-5">
                                <blockquote className="max-w-lg mx-auto mb-8">
                                    <p className="text-lg font-light text-muted-foreground leading-relaxed">
                                        "Truth is a symphony of perspectives."
                                    </p>
                                </blockquote>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-3xl mx-auto px-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Web Search</span>
                                        <span className="text-xs text-muted-foreground">Research & analysis</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Document Search</span>
                                        <span className="text-xs text-muted-foreground">PDFs, docs, sheets</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Social Search</span>
                                        <span className="text-xs text-muted-foreground">Community insights</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                            <Code2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Code Search</span>
                                        <span className="text-xs text-muted-foreground">Repos & snippets</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Academic Search</span>
                                        <span className="text-xs text-muted-foreground">Papers & research</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Forum Search</span>
                                        <span className="text-xs text-muted-foreground">Discussions & QA</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Visual Search</span>
                                        <span className="text-xs text-muted-foreground">Images & designs</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                            <Presentation className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Media Search</span>
                                        <span className="text-xs text-muted-foreground">Videos & slides</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Show only the last AI message */}
                                {messages.length > 0 && messages[messages.length - 1].sender === 'ai' && (
                                    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <SparklesIcon className="w-4 h-4 text-purple-500" />
                                                <span className="text-sm font-medium">AI Response</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => messages[messages.length - 1].onSave?.()}
                                                    disabled={messages[messages.length - 1].isSaved}
                                                >
                                                    <Bookmark className={`w-4 h-4 ${messages[messages.length - 1].isSaved ? 'fill-current' : ''}`} />
                                                    {messages[messages.length - 1].isSaved ? 'Saved' : 'Save'}
                                                </Button>
                                            </div>
                                        </div>
                                        {formatMessage(
                                            messages[messages.length - 1].content,
                                            messages[messages.length - 1].relatedResults,
                                            handleSearch,
                                            email,
                                            messages[messages.length - 1].content,
                                            searchQuery
                                        )}
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
                                    <div>What can I help you find?</div>
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