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
  const scrollAreaRef = React.useRef(null);

  useEffect(() => {
    if (isOpen) {
      const generateAIQuestions = async () => {
        setQuestionsLoading(true);
        try {
          const prompt = `Based on this article titled "${post.title}" with the following snippet: "${post.snippet}", 
            generate 5 relevant, thought-provoking questions that would help someone better understand or analyze this content. 
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
            `What are the key implications of "${post.title}"?`,
            "How might this information impact your field or industry?",
            "What potential challenges or opportunities does this present?",
            "How does this compare to existing solutions or approaches?",
            "What future developments might we expect in this area?"
          ];

          setPresetQuestions(questions.length > 0 ? questions : fallbackQuestions);
        } catch (error) {
          console.error('Error generating AI questions:', error);
          setPresetQuestions([
            `What are the main points discussed in "${post.title}"?`,
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
  }, [isOpen, post]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
        const systemPrompt = `You are having a discussion about the article titled: "${post.title}". 
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
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {post.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full space-y-4">
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
            className="flex-grow rounded-md border p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[80px]"
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

const ExpandableSearchResult = ({ post, onEngage, onBookmark, onCopyUrl }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-medium leading-tight mb-2 text-blue-600">
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