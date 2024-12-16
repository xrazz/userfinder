import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Bookmark, Link2, SendHorizontal, Loader2, CalendarIcon, UserIcon, SparklesIcon, FileTextIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from 'axios';

const TypingIndicator = () => (
  <div className="flex gap-2 mb-4 justify-start">
    <Avatar className="h-6 w-6">
      <AvatarImage src="/logo.svg" />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
    <div className="px-3 py-2 rounded-lg bg-muted">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
);

const PresetQuestion = ({ question, onClick, disabled }) => (
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
);

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
);

const ArticleSummary = ({ pageContent, isLoading, isCollapsed, post, email }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);

  useEffect(() => {
    const generateSummary = async () => {
      if (!pageContent?.summary && !post?.snippet) return;
      
      setSummaryLoading(true);
      try {
        const response = await axios.post('/api/prompt', {
          systemPrompt: "You are a skilled content summarizer. Create a concise, informative summary that captures the key points and main insights of the article. Focus on what makes this content valuable to the reader.",
          userPrompt: `Please provide a clear and concise summary (2-3 sentences) of this content:
            Title: "${pageContent?.summary?.title || post?.title}"
            Content: "${pageContent?.summary?.mainContent || post?.snippet}"
            
            Focus on the main takeaways and why they matter.`,
          email: email
        });

        setAiSummary(response.data.output);
      } catch (error) {
        console.error('Error generating AI summary:', error);
        setAiSummary('');
      } finally {
        setSummaryLoading(false);
      }
    };

    if (pageContent?.summary || post?.snippet) {
      generateSummary();
    }
  }, [pageContent, post, email]);

  if (!pageContent?.summary && !post?.snippet) return null;

  return (
    <div className={`mt-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-200 ${isCollapsed ? 'max-h-24 overflow-hidden' : ''}`}>
      <div className="p-4">
        {/* Metadata Section - only show if not collapsed */}
        {!isCollapsed && pageContent?.summary && (
          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            {pageContent.summary.publishedDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{new Date(pageContent.summary.publishedDate).toLocaleDateString()}</span>
              </div>
            )}
            {pageContent.summary.author && (
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span>{pageContent.summary.author}</span>
              </div>
            )}
          </div>
        )}

        {/* AI Summary Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium">AI Summary</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <div className="flex items-center gap-1">
                  <span>Show Less</span>
                  <ChevronUpIcon className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span>Show More</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
          
          {summaryLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          ) : (
            <div className={`text-sm text-muted-foreground leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {aiSummary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DiscussionDialog = ({ post, isOpen, onClose, email }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState([]);
  const [pageContent, setPageContent] = useState(null);
  const scrollAreaRef = React.useRef(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [hasChatStarted, setHasChatStarted] = useState(false);

  // Fetch full page content when dialog opens
  useEffect(() => {
    const fetchPageContent = async () => {
      if (isOpen && post.link) {
        try {
          const response = await axios.post('/api/scrape', { url: post.link });
          setPageContent(response.data);
        } catch (error) {
          console.error('Error fetching page content:', error);
        }
      }
    };

    fetchPageContent();
  }, [isOpen, post.link]);

  // First, add this helper function at the top of the DiscussionDialog component
  const generateQuestionsFromContent = async (title, content) => {
    try {
      const prompt = `Based on this content titled "${title}":
        "${content}"
        Generate 5 brief, engaging questions that a curious reader might ask. Each question should:
        - Be no longer than 10-12 words
        - Be conversational in tone
        - Focus on one clear aspect
        - Encourage exploration of the topic
        Format the response as a JSON array of strings.`;

      const response = await axios.post('/api/prompt', {
        systemPrompt: "You are a helpful discussion facilitator who excels at creating engaging, bite-sized questions that spark curiosity and conversation. Keep questions short, clear, and conversational.",
        userPrompt: prompt
      });

      let questions;
      try {
        const parsedResponse = typeof response.data.output === 'string' 
          ? JSON.parse(response.data.output) 
          : response.data.output;
        return Array.isArray(parsedResponse) ? parsedResponse : [];
      } catch (error) {
        console.error('Error parsing AI response:', error);
        return [];
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  };

  // Replace the existing questions generation useEffect with this:
  useEffect(() => {
    if (!isOpen) return;

    const generateAIQuestions = async () => {
      setQuestionsLoading(true);
      try {
        let questions;
        if (pageContent) {
          questions = await generateQuestionsFromContent(
            pageContent.summary.title,
            pageContent.summary.mainContent
          );
        } else {
          questions = await generateQuestionsFromContent(
            post.title,
            post.snippet
          );
        }

        const fallbackQuestions = [
          "What's the most surprising insight from this?",
          "How could this affect everyday life?",
          "What are the practical applications?",
          "What challenges might this face?",
          "Where do you see this heading in the future?"
        ];

        setPresetQuestions(questions.length > 0 ? questions : fallbackQuestions);
      } catch (error) {
        console.error('Error generating AI questions:', error);
        setPresetQuestions([
          "What caught your attention in this article?",
          "How might this impact your work?",
          "What's your take on the main idea?",
          "See any potential drawbacks?",
          "What should happen next with this?"
        ]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    generateAIQuestions();
  }, [isOpen, pageContent, post]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle sending messages
  const handleSendMessage = async (messageText = newMessage) => {
    if (messageText.trim()) {
      setHasChatStarted(true);
      const userMessage = {
        id: Date.now(),
        content: messageText,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, userMessage]);
      setNewMessage('');
      setLoading(true);

      try {
        const systemPrompt = pageContent 
          ? `You are having a detailed discussion about the article:
             Title: "${pageContent.summary.title}"
             Meta Description: "${pageContent.summary.metaDescription}"
             Main Content: "${pageContent.summary.mainContent}"
             
             Previous conversation context: ${messages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`
          : `You are having a discussion about the article titled: "${post.title}". 
             Here's a snippet of the article: "${post.snippet}". 
             Previous messages in the conversation: ${messages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`;

        const response = await axios.post('/api/prompt', {
          systemPrompt,
          userPrompt: messageText,
          email: email
        });

        const aiMessage = {
          id: Date.now(),
          content: response.data.output,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error fetching AI response:', error);
        const errorMessage = error.response?.data?.error || 'Failed to get a response. Please try again.';

        setMessages(prev => [...prev, {
          id: Date.now(),
          content: errorMessage,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        }]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <div className="px-6 pt-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              {pageContent ? pageContent.summary.title : post.title}
            </DialogTitle>
            <ArticleSummary 
              pageContent={pageContent} 
              post={post}
              isLoading={summaryLoading}
              isCollapsed={hasChatStarted}
              email={email}
            />
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden px-6 mt-2">
          {messages.length === 0 ? (
            <div className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium">Explore the topic with these questions:</p>
                </div>
                {questionsLoading ? (
                  <QuestionsSkeleton />
                ) : (
                  <div className="grid gap-2">
                    {presetQuestions.map((question, index) => (
                      <PresetQuestion
                        key={index}
                        question={question}
                        onClick={() => handleSendMessage(question)}
                        disabled={loading}
                      />
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click any question to start the conversation, or type your own below
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="flex flex-col gap-3 py-2">
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
                      <div className="text-sm prose dark:prose-invert max-w-none">
                        {message.content.split('\n').map((paragraph, idx) => {
                          // Handle headers
                          if (paragraph.startsWith('#')) {
                            const level = paragraph.match(/^#+/)[0].length;
                            const text = paragraph.replace(/^#+\s/, '');
                            const className = `text-${level === 1 ? 'lg' : 'base'} font-bold my-1`;
                            return <div key={idx} className={className}>{text}</div>;
                          }
                          // Handle lists
                          if (paragraph.match(/^[*-]\s/)) {
                            return (
                              <ul key={idx} className="list-disc ml-4 my-1">
                                <li>{paragraph.replace(/^[*-]\s/, '')}</li>
                              </ul>
                            );
                          }
                          // Handle code blocks
                          if (paragraph.match(/^```/)) {
                            return (
                              <pre key={idx} className="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto">
                                <code>{paragraph.replace(/^```\w*\n?/, '').replace(/```$/, '')}</code>
                              </pre>
                            );
                          }
                          // Regular paragraphs
                          return paragraph.trim() ? (
                            <p key={idx} className="my-1">{paragraph}</p>
                          ) : <br key={idx} />;
                        })}
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
                {loading && <TypingIndicator />}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] flex-grow"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={() => handleSendMessage()}
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
  );
};

const ExpandableSearchResult = ({ post, onEngage, onBookmark, onCopyUrl, email }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Card className="shadow-none border-none">
      <CardHeader>
      <CardTitle className="font-semibold text-xs text-blue-600 flex items-center space-x-2">
  {/* Favicon */}
  <img 
    src={`https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(post.link).hostname}`} 
    alt="favicon" 
    className="w-4 h-4"
  />
  {/* Domain Name */}
  <span>{new URL(post.link).hostname}</span>
</CardTitle>

        <CardTitle className="text-base font-medium leading-tight mb-2 text-gray-800">
          <a
            href={decodeURIComponent(post.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline line-clamp-2"
          >
            {post.title}
          </a>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
          {post.snippet}
        </p>
      </CardHeader>

      <CardFooter className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setIsDialogOpen(true)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => onCopyUrl(post.link)}
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => onBookmark(post)}
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>

      <DiscussionDialog
        post={post}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        email={email}
      />
    </Card>
  );
};

export default ExpandableSearchResult;