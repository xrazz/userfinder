import React from 'react'
import { Card } from "@/components/ui/card"
import { SparklesIcon, MessageSquareIcon, XIcon, Bookmark, Link2, MessageSquare, SendHorizontal, ArrowLeft, Loader2, ChevronUpIcon, ChevronDownIcon, ArrowUpRight } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import axios from 'axios'

interface Post {
    title: string
    link: string
    snippet: string
    searchQuery?: string
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

// Function to safely parse HTML content with links
const parseHtmlContent = (content: string): React.ReactNode => {
    if (!content) return null;

    // Split content by HTML tags
    const parts = content.split(/(<a[^>]*>.*?<\/a>)/);

    return parts.map((part, index) => {
        // Check if part is a link
        if (part.startsWith('<a')) {
            // Extract href and text content
            const hrefMatch = part.match(/href="([^"]*)"/) || [];
            const textMatch = part.match(/>([^<]*)</) || [];
            const href = hrefMatch[1];
            const text = textMatch[1];

            // Check if the text is a citation number (e.g., [1], [2], etc.)
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
        // Return regular text
        return <span key={index}>{part}</span>;
    });
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

const DiscussionDialog = ({ post, isOpen, onClose, email, onEngage }: {
    post: Post,
    isOpen: boolean,
    onClose: () => void,
    email?: string,
    onEngage?: (link: string) => void
}) => {
    const [messages, setMessages] = React.useState<Message[]>([])
    const [newMessage, setNewMessage] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [questionsLoading, setQuestionsLoading] = React.useState(false)
    const [presetQuestions, setPresetQuestions] = React.useState<string[]>([])
    const [pageContent, setPageContent] = React.useState<any>(null)
    const [isSummaryExpanded, setIsSummaryExpanded] = React.useState(true)
    const [isScrapingFailed, setIsScrapingFailed] = React.useState(false)
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)

    // Fetch full page content and generate questions when dialog opens
    React.useEffect(() => {
        const fetchPageContent = async () => {
            if (isOpen && post.link) {
                try {
                    const response = await axios.post('/api/scrape', {
                        url: post.link,
                        email: email
                    }, {
                        headers: {
                            'Authorization': `Bearer ${email}`
                        }
                    })
                    setPageContent(response.data)
                    setIsScrapingFailed(false)
                    generateQuestions(response.data)
                } catch (error) {
                    console.error('Error fetching page content:', error)
                    setIsScrapingFailed(true)
                    // Generate questions using the snippet if scraping fails
                    generateQuestions({ summary: { title: post.title, mainContent: post.snippet } })
                }
            }
        }

        fetchPageContent()
    }, [isOpen, post.link, email])

    const generateQuestions = async (content: any) => {
        if (!email) return
        setQuestionsLoading(true)
        try {
            const response = await axios.post('/api/prompt', {
                systemPrompt: `You are an expert at generating insightful questions about content. Generate 5 interesting questions that would lead to meaningful discussions about this content. Questions should:
- Be specific and thought-provoking
- Focus on key insights, implications, or applications
- Encourage analytical thinking
- Be clearly worded and engaging`,
                userPrompt: `Generate 5 interesting discussion questions about this content:

Title: ${content.summary?.title || post.title}
Content: ${content.summary?.mainContent || post.snippet}

Format each question on a new line, numbered 1-5.`,
                email: email
            }, {
                headers: {
                    'Authorization': `Bearer ${email}`
                }
            })

            // Split response into individual questions and clean them up
            const questions = response.data.output
                .split('\n')
                .filter((q: string) => q.trim())
                .map((q: string) => q.replace(/^\d+\.\s*/, '').trim())

            setPresetQuestions(questions)
        } catch (error) {
            console.error('Error generating questions:', error)
        } finally {
            setQuestionsLoading(false)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !email) return

        const userMessage: Message = {
            id: Date.now(),
            content: newMessage,
            sender: 'user',
            timestamp: new Date().toISOString(),
        }

        setMessages(prev => [...prev, userMessage])
        setNewMessage('')
        setLoading(true)

        try {
            const response = await axios.post('/api/prompt', {
                systemPrompt: `You are having a conversation about search results. Follow these rules:
- Use information ONLY from the provided sources
- Citations must be HTML links that open the source URL when clicked
- Format each citation as: <a href="source_url" target="_blank">[1]</a>
- Every fact or insight must have at least one citation
- If information isn't in the sources, say so explicitly
- Maintain conversation context while providing accurate citations
- Include a brief "References" section at the end of longer responses`,
                userPrompt: `Context: Search query was "${post.searchQuery}" with the following content:

Main Source:
Title: ${pageContent?.summary?.title || post.title}
URL: ${post.link}
Content: ${pageContent?.summary?.mainContent || post.snippet}

User's Question: ${newMessage}

Previous messages:
${messages.map(m => `${m.sender}: ${m.content}`).join('\n')}`,
                email: email
            }, {
                headers: {
                    'Authorization': `Bearer ${email}`
                }
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
            const errorMessage: Message = {
                id: Date.now(),
                content: error instanceof Error ? error.message : 'Failed to send message',
                sender: 'ai',
                timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                <div className="px-6 pt-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-medium">
                            {pageContent ? pageContent.summary?.title : post.title}
                        </DialogTitle>

                        {/* Content Summary Section */}
                        <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                            <button
                                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                className="w-full flex items-center justify-between p-4 text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-primary" />
                                    <span className="font-medium">Content Summary</span>
                                    {isScrapingFailed && (
                                        <span className="text-xs text-yellow-500 dark:text-yellow-400">
                                            (Preview Only)
                                        </span>
                                    )}
                                </div>
                                {isSummaryExpanded ? (
                                    <ChevronUpIcon className="w-4 h-4" />
                                ) : (
                                    <ChevronDownIcon className="w-4 h-4" />
                                )}
                            </button>
                            {isSummaryExpanded && (
                                <div className="px-4 pb-4">
                                    <div className="space-y-3">
                                        {/* Source Info */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <img
                                                src={`https://www.google.com/s2/favicons?sz=16&domain_url=${new URL(post.link).hostname}`}
                                                alt=""
                                                className="w-4 h-4"
                                            />
                                            <span>{new URL(post.link).hostname.replace('www.', '')}</span>
                                            {isScrapingFailed && (
                                                <span className="text-yellow-500 dark:text-yellow-400">
                                                    • Full content unavailable
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <ScrollArea className="max-h-[200px]">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {pageContent?.summary?.mainContent || post.snippet}
                                            </p>
                                        </ScrollArea>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <a
                                                href={post.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => onEngage?.(post.link)}
                                                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-1.5 transition-colors"
                                            >
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                <span>Visit Website</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                {/* Questions and Chat Section */}
                <div className="flex-1 overflow-hidden px-6 mt-4">
                    {messages.length === 0 ? (
                        <div className="h-full overflow-y-auto">
                            <div className="grid grid-cols-1 gap-3 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquareIcon className="w-5 h-5 text-primary" />
                                    <p className="text-sm font-medium">Ask questions about this content:</p>
                                </div>
                                {questionsLoading ? (
                                    <QuestionsSkeleton />
                                ) : (
                                    <div className="grid gap-2">
                                        {presetQuestions.map((question, index) => (
                                            <PresetQuestionButton
                                                key={index}
                                                question={question}
                                                onClick={() => {
                                                    setNewMessage(question)
                                                    handleSendMessage()
                                                }}
                                                disabled={loading}
                                            />
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Click a suggested question or type your own below
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-3 py-2">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        {message.sender === 'ai' && (
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src="/logo.svg" />
                                                <AvatarFallback>AI</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={`px-3 py-2 rounded-lg max-w-[80%] ${message.sender === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            <div className="text-sm whitespace-pre-wrap">
                                                {parseHtmlContent(message.content)}
                                            </div>
                                        </div>
                                        {message.sender === 'user' && (
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src="/placeholder.svg" />
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src="/logo.svg" />
                                            <AvatarFallback>AI</AvatarFallback>
                                        </Avatar>
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={messages.length === 0 ? "Ask anything about this content..." : "Type your message..."}
                            className="min-h-[60px] flex-grow"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                        />
                        <Button
                            onClick={handleSendMessage}
                            className="self-end"
                            size="icon"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <SendHorizontal className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
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
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
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
                    systemPrompt: `You are having a conversation about search results. Follow these rules:
- Use information ONLY from the provided sources
- Citations must be HTML links that open the source URL when clicked
- Format each citation as: <a href="source_url" target="_blank">[1]</a>
- Every fact or insight must have at least one citation
- If information isn't in the sources, say so explicitly
- Maintain conversation context while providing accurate citations
- Include a brief "References" section at the end of longer responses

Example format:
"Based on recent studies <a href="url1" target="_blank">[1]</a>, the key point is X. This relates to your question about Y <a href="url2" target="_blank">[2]</a>..."

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
- Citations must be HTML links that open the source URL when clicked
- Format each citation as: <a href="source_url" target="_blank">[1]</a>
- Every fact or insight must have at least one citation
- Structure your response with clear sections and bullet points
- If information isn't in the sources, explicitly state that
- Use consistent citation format throughout
- Begin each major point with its relevant citation(s)
- At the end of your analysis, include a "References" section listing all cited sources

Example format:
"The main concept is X <a href="url1" target="_blank">[1]</a>. This is further supported by research <a href="url2" target="_blank">[2]</a>, which shows that..."

References:
1. Title of Source 1
2. Title of Source 2`,
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
                    systemPrompt: `You are an expert prompt engineer. Enhance the given prompt to:
- Make it more specific and detailed
- Include requirements for HTML citation links: <a href="url" target="_blank">[1]</a>
- Request structured analysis with clear citation guidelines
- Maintain focus on the original intent
- Ensure comprehensive coverage of available sources
- Suggest including a references section

Example prompt enhancement:
"Original: Analyze the impact of X
Enhanced: Provide a detailed analysis of X's impact, using clickable HTML citation links <a href="url" target="_blank">[1]</a> for each point. Include specific examples from the sources and conclude with a numbered references section."`,
                    userPrompt: `Enhance this analysis prompt to include clear citation guidelines:
Original prompt: "${customPrompt}"

Available sources format:
${searchResults.slice(0, 1).map(result =>
                        `[${result.id}] "${result.title}"
    URL: ${result.url}
    Content: ${result.snippet}`
                    ).join('\n\n')}

Create an enhanced version that requires proper clickable citation numbers and references.`,
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
        <div className="min-w-full mx-auto md:px-0 mt-3">
            {/* AI Analysis Section */}
            <div className="mb-8 min-w-full">
            {!summary ? (
                <div className="relative">
                    <div className="bg-gradient-to-br from-purple-50 via-gray-100 to-purple-100 dark:from-gray-800 dark:via-purple-900 dark:to-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:from-purple-100 hover:via-gray-50 hover:to-purple-50 dark:hover:from-gray-900 dark:hover:via-purple-800 dark:hover:to-gray-800">
                        <div className="grid grid-cols-2">
                            <Button
                                onClick={() => generateSummary()}
                                disabled={isGenerating}
                                className="flex items-center justify-center sm:gap-2 gap-1 sm:py-4 py-2 hover:bg-purple-100/50 dark:hover:bg-purple-800/30 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200"
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

                            <Button
                                onClick={() => setShowCustomPrompt(true)}
                                disabled={isGenerating}
                                className="flex items-center justify-center sm:gap-2 gap-1 sm:py-4 py-2 hover:bg-purple-100/50 dark:hover:bg-purple-800/30 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200"
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
                                        <MessageSquareIcon className="sm:w-5 sm:h-5 w-4 h-4 text-gray-800 dark:text-gray-200" />
                                        <span className="sm:text-sm text-xs whitespace-nowrap">Custom Analysis</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {showCustomPrompt && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-4 shadow-lg z-10 transition-all duration-300 ease-in-out">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">Custom Analysis Prompt</h3>
                                <Button
                                    onClick={() => setShowCustomPrompt(false)}
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                            <Textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Ask anything about these search results..."
                                className="min-h-[100px] mb-3 resize-none text-sm"
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={enhancePrompt}
                                    disabled={!customPrompt.trim() || isGenerating}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1.5 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                    <span>Enhance</span>
                                </Button>
                                <Button
                                    onClick={() => generateSummary(customPrompt)}
                                    disabled={!customPrompt.trim() || isGenerating}
                                    size="sm"
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <MessageSquareIcon className="w-3.5 h-3.5" />
                                    <span>Analyze</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gradient-to-br from-purple-50 via-gray-100 to-purple-100 dark:from-gray-800 dark:via-purple-900 dark:to-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:from-purple-100 hover:via-gray-50 hover:to-purple-50 dark:hover:from-gray-900 dark:hover:via-purple-800 dark:hover:to-gray-800">
                    {!isChatMode ? (
                        <div className="p-6">
                            <div className="prose dark:prose-invert max-w-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                                        <SparklesIcon className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
                                        <span className="font-medium">AI Analysis</span>
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
                                            variant="outline"
                                            size="sm"
                                            className="text-xs border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
                                        >
                                            <MessageSquareIcon className="w-3.5 h-3.5 mr-1.5" />
                                            Continue in Chat
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSummary('');
                                                setCustomPrompt('');
                                                setEnhancedPrompt('');
                                            }}
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-purple-700 dark:text-purple-300"
                                            disabled={isGenerating}
                                        >
                                            New Analysis
                                        </Button>
                                    </div>
                                </div>
                                {enhancedPrompt && (
                                    <div className="mb-4 text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                                        <div className="font-medium mb-1">Enhanced Prompt:</div>
                                        <div>{enhancedPrompt}</div>
                                    </div>
                                )}
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
                                        setCustomPrompt('');
                                        setEnhancedPrompt('');
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
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

            {/* Search Results */}
            <div className="space-y-6">
                {posts.map((post, index) => (
                    <div
                        key={index}
                        className="group bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800/50 p-4"
                    >
                        <div className="space-y-4">
                            {/* URL and Domain Section */}
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

                            {/* Title Section */}
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

                            {/* Snippet Section */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {post.snippet}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedPost(post);
                                        setIsDialogOpen(true);
                                    }}
                                    className="text-sm px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-2 transition-colors font-medium"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Discuss</span>
                                </button>
                                <button
                                    onClick={() => onBookmark(post)}
                                    className="text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
                                >
                                    <Bookmark className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={() => onCopyUrl(post.link)}
                                    className="text-sm px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
                                >
                                    <Link2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPost && (
                <DiscussionDialog
                    post={selectedPost}
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setSelectedPost(null);
                    }}
                    email={email}
                    onEngage={onEngage}
                />
            )}

            {/* Load More Indicator */}
            <div className="py-8 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                    <span>Loading more results</span>
                </div>
            </div>
        </div>
    )
} 