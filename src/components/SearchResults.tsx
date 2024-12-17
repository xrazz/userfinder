import React from 'react'
import { Card } from "@/components/ui/card"
import { SparklesIcon, MessageSquareIcon, XIcon } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import SearchSummaryBot from '../app/llm/SearchSummaryBot'
import ExpandableSearchResult from '../app/llm/ExpandableSearchResult'
import { Button } from "@/components/ui/button"
import { MessageSquare, SendHorizontal, ArrowLeft, Loader2 } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    email?: string
}

interface Message {
    id: number;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
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
    email
}) => {
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [summary, setSummary] = React.useState('');
    const [showCustomPrompt, setShowCustomPrompt] = React.useState(false);
    const [customPrompt, setCustomPrompt] = React.useState('');
    const [enhancedPrompt, setEnhancedPrompt] = React.useState('');
    const [isChatMode, setIsChatMode] = React.useState(false);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

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
            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                    systemPrompt: `You are having a conversation about these search results. Previous summary: "${summary}". 
                    Context: Search query was "${searchQuery}" with ${posts.length} results.
                    Previous messages: ${messages.map(m => `${m.sender}: ${m.content}`).join('\n')}`,
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
        setIsGenerating(true);
        try {
            if (!email) {
                throw new Error('Please sign in to use AI features');
            }

            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                    systemPrompt: "You are a skilled content analyzer providing clear, structured insights.",
                    userPrompt: prompt || `Please analyze these ${posts.length} search results for "${searchQuery}" and provide a clear, concise summary of the main findings and trends:
                    ${posts.map(post => `- ${post.title}\n${post.snippet}`).join('\n\n')}`,
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
            setShowCustomPrompt(false);
        } catch (error) {
            console.error('Error generating content:', error);
            setSummary(error instanceof Error ? error.message : 'Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const enhancePrompt = async () => {
        if (!customPrompt.trim()) return;
        
        setIsGenerating(true);
        try {
            if (!email) {
                throw new Error('Please sign in to use AI features');
            }

            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${email}`
                },
                body: JSON.stringify({
                    systemPrompt: "You are an expert prompt engineer. Enhance the given prompt to be more specific, detailed, and effective. Keep the enhanced version focused on the original intent but make it more comprehensive.",
                    userPrompt: `Enhance this prompt for analyzing search results: "${customPrompt}"`,
                    email: email
                }),
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 403 
                        ? 'Please sign in to use AI features' 
                        : 'Failed to enhance prompt. Please try again.'
                );
            }

            const data = await response.json();
            setCustomPrompt(data.output || customPrompt);
            setEnhancedPrompt(data.output || customPrompt);
        } catch (error) {
            console.error('Error enhancing prompt:', error);
            setEnhancedPrompt(error instanceof Error ? error.message : 'Failed to enhance prompt. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (posts.length === 0) {
        return <div></div>
    }

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-0 mt-3">
            {/* AI Analysis Section */}
            <div className="mb-8">
                {!summary ? (
                    <div className="relative">
                        {/* Main Analysis Options */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                                <button
                                    onClick={() => generateSummary()}
                                    disabled={isGenerating}
                                    className="flex items-center justify-center gap-2 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                                >
                                    <SparklesIcon className={`w-4 h-4 text-primary ${isGenerating ? 'animate-pulse' : ''}`} />
                                    <span className="font-medium">Quick Summary</span>
                                </button>

                                <button
                                    onClick={() => setShowCustomPrompt(true)}
                                    disabled={isGenerating}
                                    className="flex items-center justify-center gap-2 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                                >
                                    <MessageSquareIcon className="w-4 h-4 text-primary" />
                                    <span className="font-medium">Custom Analysis</span>
                                </button>
                            </div>
                        </div>

                        {/* Custom Prompt Panel */}
                        {showCustomPrompt && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-lg z-10">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-medium">Custom Analysis Prompt</h3>
                                    <button 
                                        onClick={() => setShowCustomPrompt(false)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <Textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Ask anything about these search results..."
                                    className="min-h-[100px] mb-3 resize-none text-sm"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={enhancePrompt}
                                        disabled={!customPrompt.trim() || isGenerating}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                                        <span>Enhance</span>
                                    </button>
                                    <button
                                        onClick={() => generateSummary(customPrompt)}
                                        disabled={!customPrompt.trim() || isGenerating}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        <MessageSquareIcon className="w-3.5 h-3.5" />
                                        <span>Analyze</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {!isChatMode ? (
                            <div className="p-4">
                                <div className="prose dark:prose-invert max-w-none">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                                            <span>AI Analysis</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsChatMode(true);
                                                    // Initialize chat with the summary
                                                    setMessages([{
                                                        id: Date.now(),
                                                        content: summary,
                                                        sender: 'ai',
                                                        timestamp: new Date().toISOString(),
                                                    }]);
                                                }}
                                                className="text-xs px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    <span>Continue in Chat</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSummary('');
                                                    setCustomPrompt('');
                                                    setEnhancedPrompt('');
                                                }}
                                                className="text-xs px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground transition-colors"
                                                disabled={isGenerating}
                                            >
                                                New Analysis
                                            </button>
                                        </div>
                                    </div>
                                    {enhancedPrompt && (
                                        <div className="mb-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                                            <div className="font-medium mb-1">Enhanced Prompt:</div>
                                            <div>{enhancedPrompt}</div>
                                        </div>
                                    )}
                                    {isGenerating ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <div className="relative w-5 h-5">
                                                    <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                                    <div className="absolute inset-0 rounded-full border-2 border-primary opacity-20" />
                                                </div>
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span>AI is analyzing</span>
                                                    <span className="animate-pulse">.</span>
                                                    <span className="animate-pulse animation-delay-200">.</span>
                                                    <span className="animate-pulse animation-delay-400">.</span>
                                                </div>
                                            </div>
                                            
                                            <div className="relative overflow-hidden rounded-lg bg-muted/30 p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse" />
                                                        <div className="h-4 bg-muted animate-pulse rounded-full w-32" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="h-3 bg-muted animate-pulse rounded-full w-full" />
                                                        <div className="h-3 bg-muted animate-pulse rounded-full w-[90%]" />
                                                        <div className="h-3 bg-muted animate-pulse rounded-full w-[95%]" />
                                                        <div className="h-3 bg-muted animate-pulse rounded-full w-[85%]" />
                                                    </div>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                                            </div>
                                        </div>
                                    ) : (
                                        summary.split('\n').map((paragraph, idx) => (
                                            paragraph.trim() && <p key={idx} className="text-sm">{paragraph}</p>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-[500px]">
                                {/* Chat Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setIsChatMode(false)}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Back to Summary</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSummary('');
                                            setCustomPrompt('');
                                            setEnhancedPrompt('');
                                            setMessages([]);
                                            setIsChatMode(false);
                                        }}
                                        className="text-xs px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        New Analysis
                                    </button>
                                </div>

                                {/* Chat Messages */}
                                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-2 ${
                                                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                {message.sender === 'ai' && (
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src="/logo.svg" />
                                                        <AvatarFallback>AI</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div
                                                    className={`px-3 py-2 rounded-lg max-w-[80%] ${
                                                        message.sender === 'user'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                    }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                                {message.sender === 'user' && (
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src="/placeholder.svg" />
                                                        <AvatarFallback>U</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        ))}
                                        {isGenerating && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src="/logo.svg" />
                                                    <AvatarFallback>AI</AvatarFallback>
                                                </Avatar>
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Chat Input */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Ask a follow-up question..."
                                            className="min-h-[44px] max-h-32"
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
                                            className="px-3"
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

            {/* Search Results */}
            <div className="space-y-6">
                {posts.map((post, index) => (
                    <div 
                        key={index}
                        className="py-6 first:pt-0 last:pb-0 border-b last:border-b-0 border-border/40"
                    >
                        <ExpandableSearchResult
                            post={post}
                            onEngage={onEngage}
                            onBookmark={onBookmark}
                            onCopyUrl={onCopyUrl}
                            email={email}
                        />
                    </div>
                ))}
            </div>

            {/* Load More Indicator */}
            <div className="py-8 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                    <span>Loading more results</span>
                </div>
            </div>
        </div>
    )
} 