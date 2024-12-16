import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowDown, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from 'axios';

const SearchSummaryBot = ({ searchData, searchQuery, email }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const generateSummary = async () => {
    setLoading(true);
    setShowSummary(true);

    try {
      // Format the search results for the prompt
      const resultsText = searchData
        .map(post => `${post.title}\n${post.snippet}`)
        .join('\n\n');

      // Create payload for the API
      const payload = {
        systemPrompt: `Provide a summary for the following search results related to \"${searchQuery}\":`,
        userPrompt: resultsText,
        email: email
      };

      // Call the Next.js API route instead of Express backend
      const response = await axios.post('/api/prompt', payload);

      // Extract and set the summary from the API response
      setSummary(response.data.output);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!searchData.length) return null;

  return (
    <div className="mt-1">
      {!showSummary ? (
        <Button
          onClick={generateSummary}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Generate AI Summary
          <ArrowDown className="w-4 h-4" />
        </Button>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/bot-avatar.png" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              Quick Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {summary.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            Summary generated from {searchData.length} search results
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SearchSummaryBot;