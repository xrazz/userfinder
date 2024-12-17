import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bookmark, Link2, SendHorizontal, Loader2, CalendarIcon, UserIcon, SparklesIcon, MessageSquareIcon, ChevronUpIcon, ChevronDownIcon, MessageSquare, ThumbsUp, XIcon } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFirestore, doc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebaseClient';
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

const ThinkingAnimation = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="relative w-5 h-5">
      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <div className="absolute inset-0 rounded-full border-2 border-primary opacity-20" />
    </div>
    <div className="inline-flex items-center gap-1.5">
      <span>I'm thinking</span>
      <span className="animate-pulse">.</span>
      <span className="animate-pulse animation-delay-200">.</span>
      <span className="animate-pulse animation-delay-400">.</span>
    </div>
  </div>
);

const ArticleSummary = ({ pageContent, isLoading, isCollapsed, post, email }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const generateSummary = async () => {
      if (!pageContent?.summary && !post?.snippet) return;
      if (!email) return;
      
      setSummaryLoading(true);
      setIsThinking(true);
      try {
        const response = await axios.post('/api/prompt', {
          systemPrompt: "You are a skilled content summarizer. Create a concise, informative summary that captures the key points and main insights of the article. Focus on what makes this content valuable to the reader.",
          userPrompt: `Please provide a clear and concise summary (2-3 sentences) of this content:
            Title: "${pageContent?.summary?.title || post?.title}"
            Content: "${pageContent?.summary?.mainContent || post?.snippet}"
            
            Focus on the main takeaways and why they matter.`,
          email: email
        }, {
          headers: {
            'Authorization': `Bearer ${email}`
          }
        });

        setAiSummary(response.data.output);
      } catch (error) {
        console.error('Error generating AI summary:', error);
        setAiSummary(error.response?.status === 403 ? 'Please sign in to use AI features' : '');
      } finally {
        setSummaryLoading(false);
        setIsThinking(false);
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
          
          {isThinking ? (
            <ThinkingAnimation />
          ) : summaryLoading ? (
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
  const [isThinking, setIsThinking] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [summary, setSummary] = useState('');
  const [quickSummaryThinking, setQuickSummaryThinking] = useState(false);
  const [customAnalysisThinking, setCustomAnalysisThinking] = useState(false);

  // Fetch full page content when dialog opens
  useEffect(() => {
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
          });
          setPageContent(response.data);
        } catch (error) {
          console.error('Error fetching page content:', error);
        }
      }
    };

    fetchPageContent();
  }, [isOpen, post.link, email]);

  const generateSummary = async (prompt) => {
    if (!email) {
      setSummary('Please sign in to use AI features');
      setIsThinking(false);
      return;
    }

    try {
      const response = await axios.post('/api/prompt', {
        systemPrompt: `You are a content analyzer focused on providing clear, structured insights based STRICTLY on the provided search results.
- ONLY use information from the provided search results and snippets
- ALWAYS cite your sources by referencing the specific result or snippet you're drawing information from
- Format source references as markdown links: "[Main Result](URL)" or "[Related Result #](URL)"
- Every piece of information must have a clickable source link
- Keep your analysis focused and relevant to the search context
- If you cannot answer something from the provided context, explicitly state that
- Structure your response with clear sections and bullet points when appropriate
- Begin each major point with the source reference as a clickable link
- Use markdown formatting for better readability`,
        userPrompt: prompt || `Please analyze these search results and provide a clear, structured analysis with source references:

Search Context: "${post.title}"

Available Sources:
[Main Result]
Title: ${post.title}
URL: ${post.link}
Content: ${post.snippet}

${post.relatedSnippets ? `Related Sources:\n${post.relatedSnippets.map((s, i) => 
  `[Related Result ${i + 1}]\nURL: ${post.relatedLinks?.[i] || 'N/A'}\nContent: ${s}`
).join('\n\n')}` : ''}`,
        email: email
      }, {
        headers: { 
          'Authorization': `Bearer ${email}`
        }
      });

      setSummary(response.data.output);
      setShowCustomPrompt(false);
    } catch (error) {
      console.error('Error generating content:', error);
      setSummary(error.response?.status === 403 ? 'Please sign in to use AI features' : 'Failed to generate content. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickSummary = async () => {
    setQuickSummaryThinking(true);
    try {
      await generateSummary();
    } finally {
      setQuickSummaryThinking(false);
    }
  };

  const handleCustomAnalysis = () => {
    setCustomAnalysisThinking(true);
    setShowCustomPrompt(true);
    setCustomPrompt(`Please provide your specific analysis request for the following search results:

Search Query: "${post.searchQuery}"

Available Sources:
[Main Result]
Title: ${post.title}
URL: ${post.link}
Content: ${post.snippet}

${post.relatedSnippets ? `Related Sources:\n${post.relatedSnippets.map((s, i) => 
  `[Related Result ${i + 1}]\nURL: ${post.relatedLinks?.[i] || 'N/A'}\nContent: ${s}`
).join('\n\n')}` : ''}

Your analysis request (be specific about what aspects you want analyzed):`);
  };

  const handleCustomPromptSubmit = async () => {
    if (!customPrompt.trim()) return;
    setCustomAnalysisThinking(true);
    try {
      await generateSummary(`Analysis Request with Full Context:

Search Query: "${post.searchQuery}"

Available Sources:
[Main Result]
Title: ${post.title}
URL: ${post.link}
Content: ${post.snippet}

${post.relatedSnippets ? `Related Sources:\n${post.relatedSnippets.map((s, i) => 
  `[Related Result ${i + 1}]\nURL: ${post.relatedLinks?.[i] || 'N/A'}\nContent: ${s}`
).join('\n\n')}` : ''}

User's Analysis Request:
${customPrompt}`);
    } finally {
      setCustomAnalysisThinking(false);
    }
  };

  const handleCloseCustomPrompt = () => {
    setShowCustomPrompt(false);
    setCustomAnalysisThinking(false);
    setCustomPrompt('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <div className="px-6 pt-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              {pageContent ? pageContent.summary.title : post.title}
            </DialogTitle>
            {!summary ? (
              <div className="relative">
                {/* Main Analysis Options */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                    <button
                      onClick={handleQuickSummary}
                      disabled={quickSummaryThinking || customAnalysisThinking}
                      className="flex items-center justify-center gap-2 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                      {quickSummaryThinking ? (
                        <div className="flex items-center gap-2">
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          </div>
                          <span>I'm thinking...</span>
                        </div>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">Quick Summary</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCustomAnalysis}
                      disabled={quickSummaryThinking || customAnalysisThinking}
                      className="flex items-center justify-center gap-2 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                      {customAnalysisThinking ? (
                        <div className="flex items-center gap-2">
                          <div className="relative w-4 h-4">
                            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          </div>
                          <span>I'm thinking...</span>
                        </div>
                      ) : (
                        <>
                          <MessageSquareIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">Custom Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Custom Prompt Panel */}
                {showCustomPrompt && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-lg z-10">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Custom Analysis Prompt</h3>
                      <button 
                        onClick={handleCloseCustomPrompt}
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
                    <Button
                      onClick={handleCustomPromptSubmit}
                      disabled={!customPrompt.trim() || customAnalysisThinking}
                      className="w-full"
                    >
                      {customAnalysisThinking ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>I'm thinking...</span>
                        </div>
                      ) : (
                        <span>Analyze</span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none mt-4">
                {summary.split('\n').map((paragraph, idx) => (
                  paragraph.trim() && <p key={idx} className="text-sm">{paragraph}</p>
                ))}
                <Button
                  onClick={() => {
                    setSummary('');
                    setIsThinking(false);
                    setShowCustomPrompt(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  New Analysis
                </Button>
              </div>
            )}
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

const CommentSection = ({ post, email }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [post.link]);

  const fetchComments = async () => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('postLink', '==', post.link));
      const querySnapshot = await getDocs(q);
      
      const commentsData = [];
      const commentMap = new Map();
      
      // First pass: collect all comments
      for (const docSnapshot of querySnapshot.docs) {
        const comment = docSnapshot.data();
        const userDocRef = doc(db, 'users', comment.userEmail);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.exists() ? userDocSnapshot.data() : null;
        
        const commentData = {
          id: docSnapshot.id,
          ...comment,
          userName: userData?.name || comment.userEmail.split('@')[0],
          userAvatar: userData?.imageUrl || null,
          replies: [],
        };
        
        commentMap.set(docSnapshot.id, commentData);
      }
      
      // Second pass: organize into threads
      commentMap.forEach(comment => {
        if (comment.parentId) {
          const parentComment = commentMap.get(comment.parentId);
          if (parentComment) {
            parentComment.replies.push(comment);
          }
        } else {
          commentsData.push(comment);
        }
      });
      
      // Sort comments and their replies by timestamp
      const sortByTimestamp = (a, b) => b.timestamp - a.timestamp;
      commentsData.sort(sortByTimestamp);
      commentsData.forEach(comment => {
        comment.replies.sort(sortByTimestamp);
      });
      
      setComments(commentsData);
      setCommentCount(querySnapshot.size);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !email) return;
    
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        postLink: post.link,
        userEmail: email,
        content: newComment.trim(),
        timestamp: Date.now(),
        upvotes: 0,
      });
      
      setNewComment('');
      await fetchComments();
      setIsExpanded(true);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Comment Count and Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <MessageSquare className="w-4 h-4" />
        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
        {commentCount > 0 && (
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Comment Input */}
      <div className={`space-y-4 ${isExpanded ? '' : 'hidden'}`}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${email}`} />
            <AvatarFallback>{email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] resize-none"
            />
          </div>
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isLoading}
            size="sm"
            className="self-end"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              email={email}
              onUpdate={fetchComments}
              level={0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CommentThread = ({ comment, email, onUpdate, level = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-8' : ''}`}>
      <CommentCard
        comment={comment}
        email={email}
        onUpdate={onUpdate}
        onReply={() => setShowReplyInput(!showReplyInput)}
        showReplyInput={showReplyInput}
      />
      
      {hasReplies && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-8 mb-2"
          >
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
          </button>
          
          {isExpanded && (
            <div className="space-y-4 border-l-2 border-gray-100 dark:border-gray-800">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  email={email}
                  onUpdate={onUpdate}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CommentCard = ({ comment, email, onUpdate, onReply, showReplyInput }) => {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkUpvoteStatus();
  }, [comment.id, email]);

  const checkUpvoteStatus = async () => {
    if (!email) return;
    try {
      const upvoteRef = doc(db, 'upvotes', `${comment.id}_${email}`);
      const upvoteDoc = await getDoc(upvoteRef);
      setIsUpvoted(upvoteDoc.exists());
    } catch (error) {
      console.error('Error checking upvote status:', error);
    }
  };

  const handleUpvote = async () => {
    if (!email) return;
    setIsLoading(true);
    
    try {
      const upvoteRef = doc(db, 'upvotes', `${comment.id}_${email}`);
      const commentRef = doc(db, 'comments', comment.id);
      
      if (isUpvoted) {
        await deleteDoc(upvoteRef);
        await updateDoc(commentRef, {
          upvotes: comment.upvotes - 1
        });
      } else {
        await setDoc(upvoteRef, {
          commentId: comment.id,
          userEmail: email,
          timestamp: Date.now()
        });
        await updateDoc(commentRef, {
          upvotes: comment.upvotes + 1
        });
      }
      
      setIsUpvoted(!isUpvoted);
      onUpdate();
    } catch (error) {
      console.error('Error handling upvote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyContent.trim() || !email) return;
    setIsLoading(true);
    
    try {
      await addDoc(collection(db, 'comments'), {
        postLink: comment.postLink,
        userEmail: email,
        content: replyContent.trim(),
        parentId: comment.id,
        timestamp: Date.now(),
        upvotes: 0,
      });
      
      setReplyContent('');
      onReply();
      onUpdate();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.userAvatar || `https://avatar.vercel.sh/${comment.userEmail}`} />
          <AvatarFallback>{comment.userName[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.userName}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleUpvote}
              disabled={isLoading}
            >
              <ThumbsUp className={`h-4 w-4 mr-1 ${isUpvoted ? 'fill-primary' : ''}`} />
              <span className="text-xs">{comment.upvotes || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onReply}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className="mt-2 ml-8 flex items-center gap-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={handleAddReply}
            disabled={!replyContent.trim() || isLoading}
            size="sm"
            className="self-end"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

const ExpandableSearchResult = ({ post, onEngage, onBookmark, onCopyUrl, email }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Extract and format the domain
  const domain = new URL(post.link).hostname.replace('www.', '');
  
  // Format the URL for display
  const formatUrl = (url) => {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  };

  // Create a safe document ID from URL
  const createSafeDocId = (url, email) => {
    // Create a hash of the URL using a simple string manipulation
    const urlHash = url
      .split('')
      .map(char => char.charCodeAt(0).toString(16))
      .join('');
    
    // Combine with email but replace special characters
    return `${urlHash}_${email.replace(/[.@]/g, '_')}`;
  };

  useEffect(() => {
    fetchUpvoteStatus();
  }, [post.link, email]);

  const fetchUpvoteStatus = async () => {
    if (!email) return;
    try {
      const resultId = createSafeDocId(post.link, email);
      const upvoteRef = doc(db, 'result_upvotes', resultId);
      const upvoteDoc = await getDoc(upvoteRef);
      setIsUpvoted(upvoteDoc.exists());

      // Get total upvotes for this result
      const upvotesQuery = query(
        collection(db, 'result_upvotes'),
        where('resultLink', '==', post.link)
      );
      const upvotesSnapshot = await getDocs(upvotesQuery);
      setUpvoteCount(upvotesSnapshot.size);
    } catch (error) {
      console.error('Error checking upvote status:', error);
    }
  };

  const handleUpvote = async () => {
    if (!email) return;
    setIsLoading(true);
    
    try {
      const resultId = createSafeDocId(post.link, email);
      const upvoteRef = doc(db, 'result_upvotes', resultId);
      
      if (isUpvoted) {
        await deleteDoc(upvoteRef);
        setUpvoteCount(prev => prev - 1);
      } else {
        await setDoc(upvoteRef, {
          resultLink: post.link,
          userEmail: email,
          timestamp: Date.now(),
          title: post.title,
          snippet: post.snippet
        });
        setUpvoteCount(prev => prev + 1);
      }
      
      setIsUpvoted(!isUpvoted);
    } catch (error) {
      console.error('Error handling upvote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* URL and Domain Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
            <img 
              src={`https://www.google.com/s2/favicons?sz=16&domain_url=${domain}`}
              alt=""
              className="w-4 h-4"
            />
            <span>{formatUrl(post.link)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          onClick={handleUpvote}
          disabled={isLoading}
        >
          <ThumbsUp className={`h-4 w-4 mr-1.5 ${isUpvoted ? 'fill-primary text-primary' : ''}`} />
          <span className="text-sm font-medium">{upvoteCount}</span>
        </Button>
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
          onClick={() => setIsDialogOpen(true)}
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

      <DiscussionDialog
        post={post}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        email={email}
      />

      <CommentSection post={post} email={email} />
    </div>
  );
};

export default ExpandableSearchResult;