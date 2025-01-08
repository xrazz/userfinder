import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
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

interface Post {
    title: string
    link: string
    snippet: string
    searchQuery?: string
    selected?: boolean
    media?: {
        type: 'video' | 'image'
        platform?: string
        videoId?: string
        embedUrl?: string
        thumbnailUrl?: string
        url?: string
    }
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
    handleSearch: (query?: string) => void
    credits: number
    onCreditUpdate?: () => void
    searchType?: 'web' | 'media' | 'social'
}

interface Message {
    id: number;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
}

interface ScrapedContent {
    mainContent: string;
    images?: string[];
    title?: string;
    description?: string;
    url?: string;
}

interface MultimediaContent {
    type: 'video' | 'image' | 'social' | 'audio';
    url: string;
    embedUrl?: string;
    platform?: string;
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

    // Handle bold text with ** marks
    if (content.includes('**')) {
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return (
            <div>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Remove the ** marks and wrap in strong tag
                        return <strong key={index}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>
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
            // Prepara il contesto della conversazione
            const conversationContext = messages.map(m => `${m.sender}: ${m.content}`).join('\n');

            const response = await axios.post('/api/rag', {
                content: contentRef.current,
                query: newMessage,
                url: post.link,
                email: email,
                context: conversationContext // Aggiungo il contesto della conversazione
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
                                    {message.sender === 'ai' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/logo.svg" />
                                            <AvatarFallback>AI</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={`rounded-lg px-6 py-4 ${message.sender === 'user'
                                            ? 'bg-primary text-primary-foreground ml-4 max-w-[80%]'
                                            : 'bg-muted mr-4 w-full'
                                        }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">
                                            {message.sender === 'user' 
                                                ? message.content 
                                                : formatMessage(message.content)
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

// Add this helper function to get multimedia content info
const getMultimediaInfo = (url: string): MultimediaContent | null => {
    const urlLower = url.toLowerCase();
    
    // YouTube - using privacy-enhanced mode
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        const videoId = urlLower.includes('youtube.com') 
            ? url.split('v=')[1]?.split('&')[0]
            : url.split('youtu.be/')[1]?.split('?')[0];
        
        if (videoId) {
            return {
                type: 'video',
                url: url,
                // Use youtube-nocookie.com for privacy-enhanced mode
                embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
                platform: 'youtube'
            };
        }
    }
    
    // Vimeo
    if (urlLower.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) {
            return {
                type: 'video',
                url: url,
                embedUrl: `https://player.vimeo.com/video/${videoId}`,
                platform: 'vimeo'
            };
        }
    }

    // Social Media
    if (urlLower.includes('twitter.com')) {
        return {
            type: 'social',
            url: url,
            platform: 'twitter'
        };
    }

    if (urlLower.includes('instagram.com')) {
        return {
            type: 'social',
            url: url,
            platform: 'instagram'
        };
    }

    // Images
    if (['.jpg', '.jpeg', '.png', '.gif'].some(ext => urlLower.includes(ext))) {
        return {
            type: 'image',
            url: url
        };
    }

    return null;
};

// Modify MultimediaPreview component to only handle videos
const MultimediaPreview: React.FC<{ content: MultimediaContent | undefined }> = ({ content }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!content || content.type !== 'video') return null;

    if (hasError) {
        // Fallback view when embed fails
        return (
            <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                        {content.platform === 'youtube' ? (
                            <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
                            </svg>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Watch on {content.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Click to open in a new tab
                        </div>
                    </div>
                </div>
            </a>
        );
    }

    return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}
            <iframe
                src={content.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
        </div>
    );
};

// Add this helper function at the top of the file
const getFaviconUrl = (url: string) => {
    try {
        const hostname = new URL(url).hostname;
        // Use a try-catch when creating the image
        const img = new Image();
        img.onerror = () => {
            // Silently fail - no console error
            img.src = '/favicon.ico'; // fallback to default favicon
        };
        return `https://www.google.com/s2/favicons?sz=16&domain_url=${hostname}`;
    } catch (e) {
        // Silently return default favicon
        return '/favicon.ico';
    }
};

// Add this helper function to handle media preview logic
const MediaPreview: React.FC<{ post: Post, searchType?: 'web' | 'media' | 'social' }> = ({ post, searchType }) => {
    const [isImageBlocked, setIsImageBlocked] = useState(false);

    // For image search results (when post.media exists)
    if (post.media) {
        if (post.media.type === 'video' && post.media.embedUrl) {
            return (
                <div className="mt-3 mb-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        <iframe
                            src={post.media.embedUrl}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            );
        }
        
        if (post.media.type === 'image' && post.media.url && (searchType === 'media' || searchType === 'social')) {
            if (isImageBlocked) return null;

            return (
                <div className="mt-3 mb-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        <img
                            src={post.media.url}
                            alt={post.title}
                            className="object-contain w-full h-full"
                            onError={(e) => {
                                // If the image is blocked or fails to load, set the state and hide the container
                                setIsImageBlocked(true);
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            );
        }
    }

    // For regular web/social results with video links
    const multimediaContent = getMultimediaInfo(post.link);
    if (multimediaContent && multimediaContent.type === 'video' && multimediaContent.embedUrl) {
        return <MultimediaPreview content={multimediaContent} />;
    }

    return null;
};

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
    onCreditUpdate,
    searchType = 'web'
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
    const [showContentDialog, setShowContentDialog] = useState(false);
    const [scrapedContent, setScrapedContent] = useState<ScrapedContent>({ mainContent: '' });
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const scrollPositionRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
    const [loadMoreElementPosition, setLoadMoreElementPosition] = useState<number>(0);
    const loadingRef = useRef<HTMLDivElement>(null);
    const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

    // Update the infinite scroll configuration
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
        onChange: (inView) => {
            if (inView && hasMore && !isLoadingMore) {
                onLoadMore();
            }
        }
    });

    // Remove the scroll position restoration effect
    useEffect(() => {
        // Only handle new searches, not "load more" updates
        if (searchQuery) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [searchQuery]);

    // Reset states when searchQuery changes
    React.useEffect(() => {
        setSummary('');
        setMessages([]);
        setIsChatMode(false);
        setIsDialogOpen(false);
        setSelectedPost(null);
    }, [searchQuery]);

    // Handle search when platform changes
    React.useEffect(() => {
        if (pendingSearch) {
            handleSearch();
            setPendingSearch(false);
        }
    }, [platform, pendingSearch, handleSearch]);

    // Explore button click handler
    const handleExplore = (domain: string) => {
        setCustomUrl(domain);
        setSelectedSite('custom');
        setPendingSearch(true);
    };

    // Back to Universal Search button click handler
    const handleBackToUniversal = () => {
        setCustomUrl('');
        setSelectedSite('Universal search');
        setPendingSearch(true);
    };

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
                    * Use headings like based on the search results.
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

    const handleAddToAI = async (post: Post) => {
        // If already selected, allow removal regardless of content type
        if (selectedPosts.some(p => p.link === post.link)) {
            setSelectedPosts(prev => prev.filter(p => p.link !== post.link));
            return;
        }

        // Check if it's a video URL first
        const multimediaInfo = getMultimediaInfo(post.link);
        if (multimediaInfo?.type === 'video') {
            toast.error("Content not available", {
                description: "Video content cannot be used for AI analysis.",
                duration: 3000,
            });
            return;
        }

        // Check for unsupported content types
        const url = post.link.toLowerCase();
        const unsupportedPatterns = [
            { pattern: 'youtube.com', message: 'YouTube videos cannot be analyzed' },
            { pattern: 'youtu.be', message: 'YouTube videos cannot be analyzed' },
            { pattern: 'vimeo.com', message: 'Video content cannot be analyzed' },
            { pattern: 'twitter.com', message: 'Twitter/X posts cannot be analyzed' },
            { pattern: 'instagram.com', message: 'Instagram content cannot be analyzed' },
            { pattern: 'tiktok.com', message: 'TikTok content cannot be analyzed' },
            { pattern: 'facebook.com', message: 'Facebook content cannot be analyzed' },
            { pattern: 'linkedin.com', message: 'LinkedIn content cannot be analyzed' },
            { pattern: 'spotify.com', message: 'Audio content cannot be analyzed' },
            { pattern: '.mp4', message: 'Video files cannot be analyzed' },
            { pattern: '.mp3', message: 'Audio files cannot be analyzed' },
            { pattern: '.wav', message: 'Audio files cannot be analyzed' },
            { pattern: '.jpg', message: 'Image files cannot be analyzed' },
            { pattern: '.jpeg', message: 'Image files cannot be analyzed' },
            { pattern: '.png', message: 'Image files cannot be analyzed' },
            { pattern: '.gif', message: 'Image files cannot be analyzed' }
        ];

        // Check if URL matches any unsupported pattern
        const unsupportedMatch = unsupportedPatterns.find(({ pattern }) => url.includes(pattern));
        if (unsupportedMatch) {
            toast.error("Content not supported", {
                description: unsupportedMatch.message,
                duration: 3000,
            });
            return;
        }

        // Check content availability before adding
        try {
            const response = await axios.post('/api/scrape', {
                url: post.link,
                email: email
            }, {
                headers: {
                    'Authorization': `Bearer ${email}`
                }
            });

            if (!response.data.summary?.mainContent || 
                response.data.summary.mainContent.trim().length < 50) {
                toast.error("Content not available", {
                    description: "This content cannot be used for AI analysis.",
                    duration: 3000,
                });
                return;
            }

            setSelectedPosts(prev => [...prev, post]);

        } catch (error) {
            console.error('Error checking content:', error);
            toast.error("Content check failed", {
                description: "Unable to verify content availability for AI analysis.",
                duration: 3000,
            });
        }
    };

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

    const handleViewContent = async (post: Post) => {
        // Check if it's a video URL first
        const multimediaInfo = getMultimediaInfo(post.link);
        if (multimediaInfo?.type === 'video') {
            toast.error("Content not available", {
                description: "Video content cannot be viewed in this format.",
                duration: 3000,
            });
            return;
        }

        setIsLoadingContent(true);
        try {
            const response = await axios.post('/api/scrape', {
                url: post.link,
                email: email
            }, {
                headers: {
                    'Authorization': `Bearer ${email}`
                }
            });

            setScrapedContent({
                mainContent: response.data.summary?.mainContent || 'Content not available',
                images: response.data.summary?.images || [],
                title: response.data.summary?.title,
                description: response.data.summary?.description
            });
            setShowContentDialog(true);
        } catch (error) {
            console.error('Error fetching content:', error);
            toast.error("Failed to load content", {
                description: "Could not retrieve the page content. Please try again.",
            });
        } finally {
            setIsLoadingContent(false);
        }
    };

    // Content Dialog Component
    const ContentDialog = ({ 
        isOpen, 
        onClose, 
        content 
    }: { 
        isOpen: boolean, 
        onClose: () => void, 
        content: ScrapedContent 
    }) => {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-screen h-screen max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-900">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-background sticky top-0 z-10">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-semibold truncate pr-4">
                                {content.title || 'Article Content'}
                            </DialogTitle>
                            {content.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {content.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <XIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <ScrollArea className="flex-1">
                        <div className="max-w-3xl mx-auto px-8 py-6">
                            <article className="prose prose-gray dark:prose-invert max-w-none">
                                {/* Content with proper HTML rendering */}
                                <div 
                                    className="text-base leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: content.mainContent 
                                    }} 
                                />
                                
                                {/* Display images if available */}
                                {content.images && content.images.length > 0 && (
                                    <div className="mt-8 space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Related Images</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {content.images.map((img, index) => (
                                                <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                    <img
                                                        src={img}
                                                        alt={`Content image ${index + 1}`}
                                                        className="object-cover w-full h-full"
                                                        onError={(e) => {
                                                            // Hide failed images
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </article>
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t bg-background">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <a 
                                href={content.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <Link2 className="w-4 h-4" />
                                <span>View original article</span>
                            </a>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

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
                                                    {formatMessage(paragraph)}
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
                                                    className={`rounded-lg px-6 py-4 ${message.sender === 'user'
                                                        ? 'bg-primary text-primary-foreground ml-4 max-w-[80%]'
                                                        : 'bg-muted mr-4 w-full'
                                                        }`}
                                                >
                                                    <div className="text-sm whitespace-pre-wrap">
                                                        {message.sender === 'user' 
                                                            ? message.content 
                                                            : formatMessage(message.content)
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
                                                    e.preventDefault()
                                                    handleSendMessage()
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={isAnalyzing || !newMessage.trim()}
                                            className="px-3 bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            {isAnalyzing ? (
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
                            key={`${post.link}-${index}`}
                            className="group bg-white dark:bg-gray-900 first:rounded-t-xl last:rounded-b-xl p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                        >
                            <div className="space-y-4">
                                {/* URL and Domain Section - simplified without vote buttons */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
                                        <img
                                            src={getFaviconUrl(post.link)}
                                            alt=""
                                            className="w-4 h-4"
                                            onError={(e) => {
                                                // Silently handle error by setting default favicon
                                                e.currentTarget.src = '/favicon.ico';
                                                // Prevent further error events
                                                e.currentTarget.onerror = null;
                                            }}
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

                                {/* Media Preview */}
                                <MediaPreview post={post} searchType={searchType} />

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
                                            disabled={searchType !== 'web' || (getMultimediaInfo(post.link)?.type === 'video' && !selectedPosts.some(p => p.link === post.link))}
                                            className={`flex-1 sm:flex-none text-sm px-4 py-2 rounded-full 
                                                ${selectedPosts.some(p => p.link === post.link)
                                                    ? 'bg-primary text-primary-foreground dark:text-gray-900'
                                                    : searchType !== 'web'
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                        : getMultimediaInfo(post.link)?.type === 'video'
                                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                } 
                                                flex items-center justify-center gap-2 transition-colors order-1 sm:order-1`}
                                        >
                                            {selectedPosts.some(p => p.link === post.link) ? (
                                                <XIcon className="w-4 h-4" />
                                            ) : (
                                                <SparklesIcon className="w-4 h-4" />
                                            )}
                                            <span>{selectedPosts.some(p => p.link === post.link) ? 'Remove' : 'Sources'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const domain = extractDomain(post.link);
                                                const titleWords = post.title
                                                    .toLowerCase()
                                                    .split(' ')
                                                    .filter(word => word.length > 3)
                                                    .slice(0, 3)
                                                    .join(' ');
                                                handleSearch(titleWords);
                                            }}
                                            className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 transition-colors order-2 sm:order-2"
                                        >
                                            <Search className="w-4 h-4" />
                                            <span>Similar</span>
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
                                                className="flex-1 sm:flex-none text-sm px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary dark:text-white flex items-center justify-center gap-2 transition-colors font-medium order-5 sm:order-1"
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

                {/* Loading Anchor */}
                <div 
                    ref={ref}
                    className="h-20 flex items-center justify-center"
                    style={{ visibility: hasMore ? 'visible' : 'hidden' }}
                >
                    {isLoadingMore && (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading more results...</span>
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
                            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground dark:text-gray-900 flex items-center gap-1.5 sm:gap-2 transition-colors"
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
                            className="rounded-full px-6 py-6 bg-primary text-primary-foreground dark:text-gray-900 hover:bg-primary/90 shadow-lg flex items-center gap-3"
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
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground dark:text-gray-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
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

                        {/* Selected Sources Section */}
                        <div className="border-b bg-muted/50">
                            <div className="max-w-3xl mx-auto">
                                <button
                                    onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-muted/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4 text-primary" />
                                        <h3 className="text-sm font-medium">Selected Sources</h3>
                                        <span className="text-xs text-muted-foreground">({selectedPosts.length})</span>
                                    </div>
                                    <ChevronUpIcon 
                                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                            isSourcesExpanded ? '' : 'rotate-180'
                                        }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {isSourcesExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-2">
                                                {selectedPosts.map((post) => (
                                                    <div 
                                                        key={post.link}
                                                        className="flex items-center justify-between gap-4 p-2 rounded-lg bg-background"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <img
                                                                src={getFaviconUrl(post.link)}
                                                                alt=""
                                                                className="w-4 h-4 flex-shrink-0"
                                                            />
                                                            <span className="text-sm truncate">{post.title}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => {
                                                                const newSelectedPosts = selectedPosts.filter(p => p.link !== post.link);
                                                                setSelectedPosts(newSelectedPosts);
                                                                if (newSelectedPosts.length === 0) {
                                                                    setBatchAnalysisDialog(false);
                                                                }
                                                            }}
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                                {message.sender === 'user' 
                                                    ? message.content 
                                                    : formatMessage(message.content)
                                                }
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
                                    className="min-h-[44px] max-h-32 resize-none"
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
                                    className="px-3 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <SendHorizontal className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Add the ContentDialog component */}
            <ContentDialog 
                isOpen={showContentDialog} 
                onClose={() => setShowContentDialog(false)} 
                content={scrapedContent} 
            />
        </div>
    )
} 

function setPageContent(data: any) {
    throw new Error('Function not implemented.')
}
