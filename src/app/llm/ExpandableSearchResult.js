import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Bookmark, Link2, SendHorizontal, Loader2 } from 'lucide-react';
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
    className="text-xs text-left whitespace-normal h-auto py-2 hover:bg-muted"
  >
    {question}
  </Button>
);

const QuestionsSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-10 bg-muted rounded-md w-full" />
      </div>
    ))}
  </div>
);

const DiscussionDialog = ({ post, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState([]);
  const [pageContent, setPageContent] = useState(null);
  const scrollAreaRef = React.useRef(null);

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

  // Generate AI questions based on fetched content
  useEffect(() => {
    if (isOpen && pageContent) {
      const generateAIQuestions = async () => {
        setQuestionsLoading(true);
        try {
          // Use the more comprehensive semantic content for generating questions
          const prompt = `Based on this article titled "${pageContent.summary.title}", 
            with the following content: "${pageContent.summary.mainContent}", 
            generate 5 relevant, thought-provoking and short questions that would help someone 
            better understand or analyze this content. 
            The questions should be specific to the article's content and encourage critical thinking.
            Format the response as a JSON array of strings.`;

          const response = await axios.post('/api/prompt', {
            systemPrompt: "You are an AI assistant helping to generate relevant discussion questions based on article content. Focus on generating specific, contextual questions that encourage critical thinking and deeper analysis.",
            userPrompt: prompt
          });

          let questions;
          try {
            const parsedResponse = typeof response.data.output === 'string' 
              ? JSON.parse(response.data.output) 
              : response.data.output;
            questions = Array.isArray(parsedResponse) ? parsedResponse : [];
          } catch (error) {
            console.error('Error parsing AI response:', error);
            questions = [];
          }

          const fallbackQuestions = [
            `What are the key implications of "${pageContent.summary.title}"?`,
            "How might this information impact your field or industry?",
            "What potential challenges or opportunities does this present?",
            "How does this compare to existing solutions or approaches?",
            "What future developments might we expect in this area?"
          ];

          setPresetQuestions(questions.length > 0 ? questions : fallbackQuestions);
        } catch (error) {
          console.error('Error generating AI questions:', error);
          setPresetQuestions([
            `What are the main points discussed in "${pageContent.summary.title}"?`,
            "What are the potential implications of this information?",
            "How might this affect current practices or understanding?",
            "What questions does this raise for future research or development?",
            "How does this relate to existing knowledge in the field?"
          ]);
        } finally {
          setQuestionsLoading(false);
        }
      };

      generateAIQuestions();
    }
  }, [isOpen, pageContent]);

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
        // Construct a comprehensive system prompt using scraped content
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
          userPrompt: messageText
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
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {pageContent ? pageContent.summary.title : post.title}
          </DialogTitle>
        </DialogHeader>
  
        <div className="flex-grow flex flex-col space-y-4 overflow-hidden">
          {messages.length === 0 && (
            <div className="grid grid-cols-1 gap-2">
              <p className="text-sm text-muted-foreground mb-2">Suggested questions:</p>
              {questionsLoading ? (
                <QuestionsSkeleton />
              ) : (
                presetQuestions.map((question, index) => (
                  <PresetQuestion
                    key={index}
                    question={question}
                    onClick={() => handleSendMessage(question)}
                    disabled={loading}
                  />
                ))
              )}
            </div>
          )}
  
          <ScrollArea
            ref={scrollAreaRef}
            className="flex-grow overflow-y-auto rounded-md border p-4"
          >
            {/* Message rendering remains the same */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 mb-4 ${
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
                  <p className="text-sm">{message.content}</p>
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
          </ScrollArea>
        </div>
  
        {/* Footer with Textarea and send button remains the same */}
        <div className="flex gap-2 mt-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px] flex-grow"
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
      </DialogContent>
  </Dialog>
  
  );
};

const ExpandableSearchResult = ({ post, onEngage, onBookmark, onCopyUrl }) => {
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
      />
    </Card>
  );
};

export default ExpandableSearchResult;