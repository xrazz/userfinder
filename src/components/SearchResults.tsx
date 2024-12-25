import React, { useState } from 'react'
import { Card } from "@/components/ui/card"
import { SparklesIcon, MessageSquareIcon, XIcon, Bookmark, Link2, MessageSquare, SendHorizontal, ArrowLeft, Loader2, ChevronUpIcon, ChevronDownIcon, ArrowUpRight, ThumbsUp, ThumbsDown, MessageCircle, Search, Plus } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axios from 'axios'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRef } from 'react'

interface Post {
    title: string
    link: string
    snippet: string
    searchQuery?: string
    selected?: boolean
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
    email?: string
    onLoadMore: () => void
    hasMore: boolean
    isLoadingMore: boolean
    setCustomUrl: (url: string) => void
    setSelectedSite: (site: string) => void
    handleSearch: () => void
    credits: number
    onCreditUpdate?: () => void
}

interface Message {
    id: number;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
}

// Aggiorna la funzione parseHtmlContent
const parseHtmlContent = (content: string): React.ReactNode => {
    if (!content) return null;

    // Split content by HTML tags, including strong, em, and bullet points
    const parts = content.split(/(<[^>]*>.*?<\/[^>]*>|<[^>]*\/?>|\n|•)/);

    return parts.map((part, index) => {
        // Handle links
        if (part.startsWith('<a')) {
            const hrefMatch = part.match(/href="([^"]*)"/) || [];
            const textMatch = part.match(/>([^<]*)</) || [];
            const href = hrefMatch[1];
            const text = textMatch[1];
            const isCitation = /^\[\d+\]$/.test(text);

            return (
                <a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hover:underline ${isCitation
                        ? 'text-blue-500 hover:text-blue-600 font-medium px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:text-blue-300'
                        : 'text-primary'
                        }`}
                >
                    {text}
                </a>
            );
        }

        // Handle strong tags (bold)
        if (part.startsWith('<strong>')) {
            const textMatch = part.match(/>([^<]*)</) || [];
            const text = textMatch[1];
            return <strong key={index} className="text-base font-semibold block my-3">{text}</strong>;
        }

        // Handle emphasis tags (italic)
        if (part.startsWith('<em>')) {
            const textMatch = part.match(/>([^<]*)</) || [];
            const text = textMatch[1];
            return <em key={index} className="text-primary-600 dark:text-primary-400">{text}</em>;
        }

        // Handle bullet points
        if (part === '•') {
            return <span key={index} className="mr-2">•</span>;
        }

        // Handle line breaks
        if (part === '\n') {
            return <br key={index} />;
        }

        // Return regular text if not a special tag
        if (part.trim()) {
            return <span key={index}>{part}</span>;
        }

        return null;
    }).filter(Boolean); // Remove null values
};

interface PresetQuestion {
    question: string
    onClick: () => void
    disabled: boolean
}

const QuestionsSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20" />
                <div className="flex-1">
                    <div className="h-8 bg-muted rounded-lg w-full" />
                </div>
            </div>
        ))}
    </div>
)

const PresetQuestionButton = ({ question, onClick, disabled }: PresetQuestion) => (
    <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="text-sm text-left whitespace-normal h-auto py-2 px-4 
            hover:bg-primary/10 hover:text-primary 
            transition-colors duration-200
            border border-muted-foreground/20
            rounded-lg
            flex items-center gap-2"
    >
        <SparklesIcon className="w-4 h-4 text-primary/60" />
        <span className="flex-1">{question}</span>
    </Button>
)

// Update the formatMessage function to better handle HTML content
const formatMessage = (content: string): React.ReactNode => {
    // If the content contains any HTML tags, render it directly
    if (/<[^>]*>/g.test(content)) {
        // Clean up any markdown-style formatting that might be mixed with HTML
        const cleanedContent = content
            // Replace markdown-style bold with HTML strong tags
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Replace markdown-style bullet points with HTML list items
            .replace(/^• (.*?)$/gm, '<li class="flex gap-2"><span class="text-primary">•</span><span>$1</span></li>');

        return (
            <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: cleanedContent }} 
            />
        );
    }

    // Fallback to plain text formatting
    return content.split('\n').map((line, index) => {
        if (line.startsWith('• ')) {
            return (
                <div key={index} className="ml-4 my-1 flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>{line.substring(2)}</span>
                </div>
            );
        } else if (line.trim() === '') {
            return <div key={index} className="h-2" />;
        } else {
            return <p key={index} className="my-1">{line}</p>;
        }
    });
};



const DiscussionDialog = ({ post, isOpen, onClose, email, onEngage }: {
    post: Post,
    isOpen: boolean,
    onClose: () => void,
    email?: string,
    onEngage?: (link: string) => void
}) => {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [initialLoading, setInitialLoading] = React.useState(true);
    const [isApiLoading, setIsApiLoading] = React.useState(false);
    const [pageContent, setPageContent] = React.useState<any>(null);
    const contentRef = useRef<string>('');

    // Modify the fetchContent function in useEffect
    React.useEffect(() => {
        const fetchContent = async () => {
            if (isOpen && post.link) {
                setInitialLoading(true);
                setIsApiLoading(true);
                try {
                    const response = await axios.post('/api/scrape', {
                        url: post.link,
                        email: email
                    }, {
                        headers: {
                            'Authorization': `Bearer ${email}`
                        }
                    });

                    // Check if semanticContent is empty
                    if (!response.data.summary?.mainContent || 
                        (Array.isArray(response.data.semanticContent) && 
                         response.data.semanticContent.length === 0)) {
                        toast.error("Limited AI Analysis", {
                            description: "Detailed AI information is not available for this content.",
                            duration: 4000,
                        });
                        onClose();
                        return;
                    }

                    // Store the content for RAG
                    contentRef.current = response.data.summary.mainContent;
                    setPageContent(response.data);

                    // Initial analysis prompt
                    const aiResponse = await axios.post('/api/rag', {
                        content: response.data.summary.mainContent,
                        query: "Provide a clear summary of the main points and key findings from this content.",
                        url: post.link,
                        email: email
                    });

                    if (aiResponse.data.output) {
                        setMessages([{
                            id: Date.now(),
                            content: aiResponse.data.output,
                            sender: 'ai',
                            timestamp: new Date().toISOString()
                        }]);
                    }
                } catch (error) {
                    console.error('Error fetching page content:', error);
                    toast.error("Error Loading Content", {
                        description: "Failed to load content details. Please try again.",
                        duration: 3000,
                    });
                    onClose();
                } finally {
                    setInitialLoading(false);
                    setIsApiLoading(false);
                }
            }
        };

        fetchContent();
    }, [isOpen, post.link, email, onClose]);

    // Modify the message handling to use RAG
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !email || isApiLoading) return

        const userMessage: Message = {
            id: Date.now(),
            content: newMessage,
            sender: 'user',
            timestamp: new Date().toISOString(),
        }

        setMessages(prev => [...prev, userMessage])
        setNewMessage('')
        setLoading(true)
        setIsApiLoading(true)

        try {
            const response = await axios.post('/api/rag', {
                content: contentRef.current,
                query: newMessage,
                url: post.link,
                email: email
            })

            const aiMessage: Message = {
                id: Date.now(),
                content: response.data.output,
                sender: 'ai',
                timestamp: new Date().toISOString(),
            }

            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            console.error('Error in chat:', error)
            toast.error("Failed to get response", {
                description: "Please try again or rephrase your question.",
                duration: 3000,
            })
        } finally {
            setLoading(false)
            setIsApiLoading(false)
        }
    }

    // Add this function to handle question clicks
    const handleQuestionClick = (question: string) => {
        setNewMessage(question);
        handleSendMessage();
    };

    // Add this helper function to extract image URLs from HTML strings
    const extractImageUrls = (content: string): string[] => {
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        const urls: string[] = [];
        let match;

        while ((match = imgRegex.exec(content)) !== null) {
            urls.push(match[1]);
        }

        return urls;
    }

    // Update the formatMessageWithClickableQuestions function
    const formatMessageWithClickableQuestions = (content: string): React.ReactNode => {
        // If the content contains any HTML tags, render it directly
        if (/<[^>]*>/g.test(content)) {
            // Clean up any markdown-style formatting that might be mixed with HTML
            const cleanedContent = content
                // Replace markdown-style bold with HTML strong tags
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Replace markdown-style bullet points with HTML list items
                .replace(/^• (.*?)$/gm, '<li class="flex gap-2"><span class="text-primary">•</span><span>$1</span></li>');

            return (
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: cleanedContent }} 
                />
            );
        }

        // Fallback to plain text formatting
        return content.split('\n').map((line, index) => {
            if (line.startsWith('• ')) {
                return (
                    <div key={index} className="ml-4 my-1 flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span>{line.substring(2)}</span>
                    </div>
                );
            } else if (line.trim() === '') {
                return <div key={index} className="h-2" />;
            } else {
                return <p key={index} className="my-1">{line}</p>;
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-screen h-screen max-w-full max-h-screen p-0 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <DialogTitle className="text-lg font-medium">
                                {post.title}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <img
                                    src={`https://www.google.com/s2/favicons?sz=16&domain_url=${new URL(post.link).hostname}`}
                                    alt=""
                                    className="w-4 h-4"
                                />
                                {new URL(post.link).hostname.replace('www.', '')}
                            </p>
                        </div>
                    </div>

                    {/* Add Visit Page button */}
                    <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onEngage?.(post.link)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg 
                            bg-primary text-primary-foreground hover:bg-primary/90 
                            transition-colors text-sm font-medium"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Visit Page
                    </a>
                </div>

                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {initialLoading ? (
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing content...</span>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`rounded-lg px-6 py-4 ${message.sender === 'user'
                                                ? 'bg-primary text-primary-foreground ml-4 max-w-[80%]'
                                                : 'bg-muted mr-4 w-full'
                                            }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">
                                            {formatMessageWithClickableQuestions(message.content)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ask a question..."
                            className="min-h-[60px] max-h-[120px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={loading || !newMessage.trim()}
                            size="icon"
                            className="self-end h-[60px] w-[60px]"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <SendHorizontal className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Add this helper function at the top of the file
const extractDomain = (url: string): string => {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname
    } catch (error) {
        console.error('Error extracting domain:', error)
        return ''
    }
}

// Add this helper function to format domain names nicely
const formatDomain = (domain: string): string => {
    return domain.replace(/^www\./, '')
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    platform,
    posts,
    logo,
    searchQuery,
    currentFilter,
    onBookmark,
    onEngage,
    onCopyUrl,
    email,
    onLoadMore,
    hasMore,
    isLoadingMore,
    setCustomUrl,
    setSelectedSite,
    handleSearch,
    credits,
    onCreditUpdate
}) => {
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [summary, setSummary] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
    const [isChatMode, setIsChatMode] = React.useState(false);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [pendingSearch, setPendingSearch] = React.useState(false);
    const [selectedPosts, setSelectedPosts] = useState<Post[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [batchAnalysisDialog, setBatchAnalysisDialog] = useState(false)

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !email) return;

        const userMessage: Message = {
            id: Date.now(),
            content: newMessage,
            sender: 'user',
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsGenerating(true);

        try {
            // Prepare search results with references
            const searchResults = posts.map((post, index) => ({
                id: index + 1,
                title: post.title,
                snippet: post.snippet,
                url: post.link
            }));

            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                    systemPrompt: `You are a knowledgeable assistant analyzing search results. Format your responses using HTML for better readability:

Key formatting rules:
- Use semantic HTML tags for structure and styling
- Wrap section titles in <h3> tags with appropriate classes
- Use <ul> and <li> for lists
- Add proper spacing between sections
- Include citations as clickable links
- Use emphasis tags for key terms
- Format code snippets in <pre> and <code> tags if needed

Example format:
<h3 class="text-lg font-semibold text-primary mb-3">Key Findings</h3>
<p class="mb-4">The main concept involves <em>key term</em> as shown in <a href="url" target="_blank" class="text-primary hover:underline">[1]</a>.</p>

<h3 class="text-lg font-semibold text-primary mb-3">Detailed Analysis</h3>
<ul class="space-y-2 mb-4">
  <li class="flex gap-2">
    <span class="text-primary">•</span>
    <span>Finding with <a href="url" target="_blank" class="text-primary hover:underline">[2]</a></span>
  </li>
</ul>

Previous summary: "${summary}"
Context: Search query was "${searchQuery}" with ${posts.length} results.
Previous messages: ${messages.map(m => `${m.sender}: ${m.content}`).join('\n')}

Available Sources:
${searchResults.map(result =>
    `[${result.id}] "${result.title}"
    URL: ${result.url}
    Content: ${result.snippet}`
).join('\n\n')}`,
                    userPrompt: newMessage,
                    email: email
                }),
            });

            if (!response.ok) {
                throw new Error(response.status === 403 ? 'Please sign in to continue' : 'Failed to send message');
            }

            const data = await response.json();
            const aiMessage: Message = {
                id: Date.now(),
                content: data.output,
                sender: 'ai',
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error in chat:', error);
            const errorMessage: Message = {
                id: Date.now(),
                content: error instanceof Error ? error.message : 'Failed to send message',
                sender: 'ai',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };

    const generateSummary = async (prompt?: string) => {
        if (credits <= 0) {
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

        setIsGenerating(true);
        try {
            if (!email) {
                throw new Error('Please sign in to use AI features');
            }

            // Prepare search results with references
            const searchResults = posts.map((post, index) => ({
                id: index + 1,
                title: post.title,
                snippet: post.snippet,
                url: post.link
            }));

            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                    systemPrompt: `You are a skilled content analyzer providing clear, structured insights. Follow these rules:
- ONLY use information from the provided search results
- Use HTML/Markdown formatting for better readability:
  * Use <strong> for section titles and important concepts
  * Use <em> for emphasis and key terms
  * Use bullet points for lists
  * never use * or ** for emphasis
  * Add line breaks between sections
  * Use headings like "Key Points:", "Main Findings:", "Analysis:", etc.
- Citations must be HTML links that open the source URL when clicked
- Format each citation as: <a href="source_url" target="_blank">[1]</a>
- Every fact or insight must have at least one citation
- Structure your response with clear sections and bullet points
- If information isn't in the sources, explicitly state that

Example format:
"<strong>Key Findings:</strong>
• The main concept is <em>X</em> <a href="url1" target="_blank">[1]</a>
• Research shows that <em>Y</em> <a href="url2" target="_blank">[2]</a>

<strong>Detailed Analysis:</strong>
..."`,
                    userPrompt: prompt || `Analyze these ${posts.length} search results for "${searchQuery}" and provide a clear, structured summary with citations:

Available Sources:
${searchResults.map(result =>
                        `[${result.id}] "${result.title}"
    URL: ${result.url}
    Content: ${result.snippet}`
                    ).join('\n\n')}

Provide a comprehensive analysis with clickable citation numbers that open source URLs when clicked.`,
                    email: email
                }),
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 403
                        ? 'Please sign in to use AI features'
                        : 'Failed to generate content. Please try again.'
                );
            }

            const data = await response.json();
            setSummary(data.output);

            // Se la generazione ha successo, aggiorna i crediti
            onCreditUpdate?.();

        } catch (error) {
            console.error('Error generating content:', error);
            setSummary(error instanceof Error ? error.message : 'Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Configurazione dell'observer per lo scroll infinito
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    })

    // Trigger del caricamento quando l'elemento è in vista
    React.useEffect(() => {
        if (inView && hasMore && !isLoadingMore) {
            onLoadMore()
        }
    }, [inView, hasMore, isLoadingMore, onLoadMore])

    // Aggiungi questo useEffect per resettare gli stati quando searchQuery cambia
    React.useEffect(() => {
        // Reset all AI-related states when search query changes
        setSummary('');
        setMessages([]);
        setIsChatMode(false);
        setIsDialogOpen(false);
        setSelectedPost(null);
    }, [searchQuery]);  // Dipendenza da searchQuery

    // Add this useEffect to handle search when platform changes
    React.useEffect(() => {
        if (pendingSearch) {
            handleSearch();
            setPendingSearch(false);
        }
    }, [platform, pendingSearch, handleSearch]);

    // Modify the Explore button click handler
    const handleExplore = (domain: string) => {
        setCustomUrl(domain);
        setSelectedSite('custom');
        setPendingSearch(true);
    };

    // Modify the Back to Universal Search button click handler
    const handleBackToUniversal = () => {
        setCustomUrl('');
        setSelectedSite('Universal search');
        setPendingSearch(true);
    };

    const handleAIClick = (post: Post) => {
        if (credits <= 0) {
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

        setSelectedPost(post);
        setIsDialogOpen(true);
        onCreditUpdate?.();
    }

    const handleAddToAI = (post: Post) => {
        if (selectedPosts.some(p => p.link === post.link)) {
            setSelectedPosts(prev => prev.filter(p => p.link !== post.link))
        } else {
            setSelectedPosts(prev => [...prev, post])
        }
    }

    const handleBatchAnalysis = async () => {
        if (credits <= 0) {
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
            })
            return
        }

        setIsAnalyzing(true)
        setBatchAnalysisDialog(true)

        try {
            // Scrape all selected posts
            const scrapedResults = await Promise.all(
                selectedPosts.map(async post => {
                    try {
                        const response = await axios.post('/api/scrape', {
                            url: post.link,
                            email: email
                        }, {
                            headers: {
                                'Authorization': `Bearer ${email}`
                            }
                        })
                        return {
                            ...post,
                            content: response.data.summary?.mainContent || ''
                        }
                    } catch (error) {
                        console.error('Error scraping:', error)
                        return {
                            ...post,
                            content: post.snippet // Fallback to snippet if scraping fails
                        }
                    }
                })
            )

            // Create a virtual combined URL for batch analysis
            const batchUrl = `batch-analysis-${Date.now()}`

            // Combine all content for RAG
            const combinedContent = scrapedResults
                .map((result, index) => 
                    `[${index + 1}] "${result.title}"\nURL: ${result.link}\nContent: ${result.content}`
                ).join('\n\n')

            // Initial analysis
            const aiResponse = await axios.post('/api/rag', {
                content: combinedContent,
                query: "Provide a comprehensive analysis of these sources, highlighting key findings, connections, and insights. Include specific citations to the sources.",
                email: email,
                url: batchUrl // Add the required url parameter
            })

            if (aiResponse.data.output) {
                setMessages([{
                    id: Date.now(),
                    content: aiResponse.data.output,
                    sender: 'ai',
                    timestamp: new Date().toISOString()
                }])
            }

            onCreditUpdate?.()
        } catch (error: any) {
            console.error('Error in batch analysis:', error)
            toast.error("Error analyzing content", {
                description: error.response?.data?.error || "Failed to analyze the selected content. Please try again.",
            })
            // Close the dialog if there's an error
            setBatchAnalysisDialog(false)
        } finally {
            setIsAnalyzing(false)
        }
    }

    if (posts.length === 0) {
        return <div></div>
    }

    function formatMessageWithClickableQuestions(content: string): React.ReactNode {
        // If the content contains any HTML tags, render it directly
        if (/<[^>]*>/g.test(content)) {
            // Clean up any markdown-style formatting that might be mixed with HTML
            const cleanedContent = content
                // Replace markdown-style bold with HTML strong tags
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Replace markdown-style bullet points with HTML list items
                .replace(/^• (.*?)$/gm, '<li class="flex gap-2"><span class="text-primary">•</span><span>$1</span></li>');

            return (
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: cleanedContent }} 
                />
            );
        }

        // Fallback to plain text formatting
        return content.split('\n').map((line, index) => {
            if (line.startsWith('• ')) {
                return (
                    <div key={index} className="ml-4 my-1 flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span>{line.substring(2)}</span>
                    </div>
                );
            } else if (line.trim() === '') {
                return <div key={index} className="h-2" />;
            } else {
                return <p key={index} className="my-1">{line}</p>;
            }
        });
    }

    return (
        <div className="min-w-full mx-auto md:px-0 mt-3">
            {/* AI Analysis Section */}
            <div className="mb-8 min-w-full">
                {!summary ? (
                    <div className="relative">
                        <div className="bg-gradient-to-br from-purple-50 via-gray-100 to-purple-100 dark:from-gray-800 dark:via-purple-900 dark:to-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:from-purple-100 hover:via-gray-50 hover:to-purple-50 dark:hover:from-gray-900 dark:hover:via-purple-800 dark:hover:to-gray-800">
                            <Button
                                onClick={() => generateSummary()}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center sm:gap-2 gap-1 sm:py-4 py-2 hover:bg-purple-100/50 dark:hover:bg-purple-800/30 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200"
                                variant="ghost"
                            >
                                {isGenerating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-5 h-5">
                                            <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                                        </div>
                                        <span>Analyzing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <SparklesIcon className="sm:w-5 sm:h-5 w-4 h-4 text-gray-800 dark:text-gray-200" />
                                        <span className="sm:text-sm text-xs whitespace-nowrap">Quick Summary</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-purple-50 via-gray-100 to-purple-100 dark:from-gray-800 dark:via-purple-900 dark:to-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:from-purple-100 hover:via-gray-50 hover:to-purple-50 dark:hover:from-gray-900 dark:hover:via-purple-800 dark:hover:to-gray-800">
                        {!isChatMode ? (
                            <div className="p-6">
                                <div className="prose dark:prose-invert max-w-none">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-sm ">
                                            <SparklesIcon className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
                                            <span className="font-semibold">AI Analysis</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => {
                                                    setIsChatMode(true);
                                                    setMessages([{
                                                        id: Date.now(),
                                                        content: summary,
                                                        sender: 'ai',
                                                        timestamp: new Date().toISOString(),
                                                    }]);
                                                }}
                                                variant="default"
                                                size="sm"
                                                className="text-xs font-semibold"
                                            >
                                                <MessageSquareIcon className="w-3.5 h-3.5 mr-1.5 font-semibold" />
                                                Continue in Chat
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setSummary('');
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs font-semibold"
                                                disabled={isGenerating}
                                            >
                                                New Analysis
                                            </Button>
                                        </div>
                                    </div>
                                    {isGenerating ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-sm text-purple-700 dark:text-purple-300">
                                                <div className="relative w-5 h-5">
                                                    <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                                                    <div className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-20" />
                                                </div>
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span>AI is analyzing</span>
                                                    <span className="animate-pulse">.</span>
                                                    <span className="animate-pulse animation-delay-200">.</span>
                                                    <span className="animate-pulse animation-delay-400">.</span>
                                                </div>
                                            </div>

                                            <div className="relative overflow-hidden rounded-lg bg-purple-100/50 dark:bg-purple-900/30 p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-purple-300 dark:bg-purple-700 animate-pulse" />
                                                        <div className="h-4 bg-purple-200 dark:bg-purple-800 animate-pulse rounded-full w-32" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="h-3 bg-purple-200 dark:bg-purple-800 animate-pulse rounded-full w-full" />
                                                        <div className="h-3 bg-purple-200 dark:bg-purple-800 animate-pulse rounded-full w-[90%]" />
                                                        <div className="h-3 bg-purple-200 dark:bg-purple-800 animate-pulse rounded-full w-[95%]" />
                                                        <div className="h-3 bg-purple-200 dark:bg-purple-800 animate-pulse rounded-full w-[85%]" />
                                                    </div>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/10 dark:via-purple-700/10 to-transparent animate-shimmer" />
                                            </div>
                                        </div>
                                    ) : (
                                        summary.split('\n').map((paragraph, idx) => (
                                            paragraph.trim() && (
                                                <p key={idx} className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                                                    {parseHtmlContent(paragraph)}
                                                </p>
                                            )
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-[500px]">
                                <div className="flex items-center justify-between p-4 border-b border-purple-200 dark:border-purple-700">
                                    <Button
                                        onClick={() => setIsChatMode(false)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-sm text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Summary
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSummary('');
                                            setMessages([]);
                                            setIsChatMode(false);
                                        }}
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-purple-700 dark:text-purple-300"
                                    >
                                        New Analysis
                                    </Button>
                                </div>

                                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {message.sender === 'ai' && (
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src="/logo.svg" />
                                                        <AvatarFallback>AI</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div
                                                    className={`px-4 py-2 rounded-lg max-w-[80%] ${message.sender === 'user'
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-purple-100 dark:bg-purple-900 text-gray-800 dark:text-gray-200'
                                                        }`}
                                                >
                                                    <div className="text-sm whitespace-pre-wrap prose dark:prose-invert max-w-none prose-sm">
                                                        {message.sender === 'user'
                                                            ? message.content
                                                            : parseHtmlContent(message.content)
                                                        }
                                                    </div>
                                                </div>
                                                {message.sender === 'user' && (
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src="/placeholder.svg" />
                                                        <AvatarFallback>U</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        ))}
                                        {isGenerating && (
                                            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="/logo.svg" />
                                                    <AvatarFallback>AI</AvatarFallback>
                                                </Avatar>
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                <div className="p-4 border-t border-purple-200 dark:border-purple-700">
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Ask a follow-up question..."
                                            className="min-h-[44px] max-h-32 resize-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={isGenerating || !newMessage.trim()}
                                            className="px-3 bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            {isGenerating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <SendHorizontal className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Results Count & Filter */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <span>{posts.length} results</span>
                {currentFilter && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{currentFilter}</span>
                    </>
                )}
            </div>

            {/* Search Results with Background */}
            <div className="rounded-xl bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800">
                {/* Search Results List */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {posts.map((post, index) => (
                        <div
                            key={index}
                            className="group bg-white dark:bg-gray-900 first:rounded-t-xl last:rounded-b-xl p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                        >
                            <div className="space-y-4">
                                {/* URL and Domain Section - simplified without vote buttons */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                                        <img
                                            src={`https://www.google.com/s2/favicons?sz=16&domain_url=${new URL(post.link).hostname}`}
                                            alt=""
                                            className="w-4 h-4"
                                        />
                                        <span>{new URL(post.link).hostname.replace('www.', '')}</span>
                                    </div>
                                </div>

                                {/* Title Section - remains the same */}
                                <h3 className="text-lg font-medium leading-tight">
                                    <a
                                        href={decodeURIComponent(post.link)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors"
                                        onClick={() => onEngage(post.link)}
                                    >
                                        {post.title}
                                    </a>
                                </h3>

                                {/* Snippet Section - remains the same */}
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {post.snippet}
                                </p>

                                {/* Action Buttons - removed voting and comments */}
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        {/* Mobile-first order */}
                                        <button
                                            onClick={() => handleAddToAI(post)}
                                            className={`flex-1 sm:flex-none text-sm px-4 py-2 rounded-full 
                                                ${selectedPosts.some(p => p.link === post.link)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                } 
                                                flex items-center justify-center gap-2 transition-colors order-1 sm:order-1`}
                                        >
                                            {selectedPosts.some(p => p.link === post.link) ? (
                                                <XIcon className="w-4 h-4" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                            <span>{selectedPosts.some(p => p.link === post.link) ? 'Remove' : 'Sources'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleAIClick(post)}
                                            className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 transition-colors order-2 sm:order-2"
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            <span>AI</span>
                                        </button>
                                        <button
                                            onClick={() => onBookmark(post)}
                                            className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 transition-colors order-3 sm:order-3"
                                        >
                                            <Bookmark className="w-4 h-4" />
                                            <span>Save</span>
                                        </button>
                                        {platform === 'Universal search' && (
                                            <button
                                                onClick={() => {
                                                    const domain = extractDomain(post.link)
                                                    if (domain) {
                                                        handleExplore(domain);
                                                    }
                                                }}
                                                className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center gap-2 transition-colors font-medium order-4 sm:order-1"
                                            >
                                                <Search className="w-4 h-4" />
                                                <span>Explore</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Infinite Scroll Trigger & Loading State */}
                <div ref={ref} className="py-8 text-center">
                    {isLoadingMore && (
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                            <span>Loading more results</span>
                        </div>
                    )}
                    {!hasMore && posts.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            No more results to load
                        </div>
                    )}
                </div>
            </div>

            {selectedPost && (
                <DiscussionDialog
                    post={selectedPost}
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false)
                        setSelectedPost(null)
                    }}
                    email={email}
                    onEngage={onEngage}
                />
            )}

            {platform && platform !== 'Universal search' && (
                <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>
                                Exploring <span className="font-medium text-purple-600 dark:text-purple-400">{formatDomain(platform)}</span>
                            </span>
                        </div>
                        <button
                            onClick={handleBackToUniversal}
                            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 sm:gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Back to Universal</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating AI Analysis Button */}
            {selectedPosts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <div className="relative">
                        <Button
                            onClick={handleBatchAnalysis}
                            disabled={isAnalyzing}
                            className="rounded-full px-6 py-6 bg-primary text-white hover:bg-primary/90 shadow-lg flex items-center gap-3"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Analyzing {selectedPosts.length} items...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Analyze {selectedPosts.length} items</span>
                                </>
                            )}
                        </Button>
                        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {selectedPosts.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Analysis Dialog */}
            {batchAnalysisDialog && (
                <Dialog open={batchAnalysisDialog} onOpenChange={() => setBatchAnalysisDialog(false)}>
                    <DialogContent className="w-screen h-screen max-w-full max-h-screen p-0 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setBatchAnalysisDialog(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <DialogTitle className="text-lg font-medium">
                                        AI Analysis
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Analyzing {selectedPosts.length} selected items
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <ScrollArea className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`rounded-lg px-6 py-4 ${message.sender === 'user'
                                                ? 'bg-primary text-primary-foreground ml-4 max-w-[80%]'
                                                : 'bg-muted mr-4 w-full'
                                                }`}
                                        >
                                            <div className="text-sm whitespace-pre-wrap">
                                                {formatMessageWithClickableQuestions(message.content)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isAnalyzing && (
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Analyzing content...</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background">
                            <div className="max-w-3xl mx-auto flex gap-3">
                                <Textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Ask a question about the selected items..."
                                    className="min-h-[60px] max-h-[120px] resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isAnalyzing || !newMessage.trim()}
                                    size="icon"
                                    className="self-end h-[60px] w-[60px]"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <SendHorizontal className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
} 

function setPageContent(data: any) {
    throw new Error('Function not implemented.')
}
