'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight, 
  Target, 
  Lightbulb, 
  Filter, 
  Search 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const QueryTutorialModal = () => {
  const [activeExample, setActiveExample] = useState(null);
  const [activeTab, setActiveTab] = useState("examples");

  const examples = [
    {
      title: "Community Insights",
      query: "Top discussions about AI in tech communities",
      description: "Uncover nuanced perspectives from tech professionals",
      difficulty: "Beginner",
      tags: ["AI", "Technology", "Community Trends"]
    },
    {
      title: "User Sentiment",
      query: "Startup founders' challenges with product development",
      description: "Explore real-world experiences and pain points",
      difficulty: "Intermediate",
      tags: ["Startups", "Product Management", "User Experience"]
    },
    {
      title: "Market Trends",
      query: "Developer attitudes towards emerging programming frameworks",
      description: "Identify cutting-edge technological shifts",
      difficulty: "Advanced",
      tags: ["Software Development", "Technology Trends", "Professional Insights"]
    }
  ];

  const useCases = [
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "User Research",
      description: "Collect authentic user insights, pain points, and experiences across diverse communities",
      techniques: [
        "Multi-platform search",
        "Sentiment analysis",
        "Contextual filtering"
      ],
      example: "Query: 'Remote work challenges for software engineers'"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      title: "Trend Analysis",
      description: "Detect emerging trends, popular discussions, and evolving sentiments in specific domains",
      techniques: [
        "Time-based trend tracking",
        "Cross-platform comparison",
        "Sentiment tracking"
      ],
      example: "Query: 'AI tools transforming startup workflows'"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-purple-500" />,
      title: "Expert Knowledge Mining",
      description: "Deep dive into community discussions, expert opinions, and collective wisdom",
      techniques: [
        "Expert identification",
        "Knowledge clustering",
        "Credibility scoring"
      ],
      example: "Query: 'Most recommended learning resources for machine learning'"
    }
  ];

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-700 "
              >
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
                <span className="sr-only">Search Help & Tutorial</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Search Tutorial & Advanced Tips
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Search className="w-7 h-7" />
            Advanced Audience Search Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Enhanced Hero Section */}
          <div className="text-center space-y-5 bg-secondary/30 p-6 rounded-lg">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Target className="w-8 h-8 text-primary" /> 
              Precision Insights Across Communities
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform raw online discussions into actionable intelligence. Our advanced search empowers you to extract meaningful insights from diverse digital landscapes.
            </p>
          </div>

          {/* Filtering Options with Enhanced Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Filter className="w-6 h-6" /> 
                Intelligent Search Filtering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-lg">Leverage granular filtering to precision-target your research:</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">⏰ Temporal Precision</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Today's pulse</li>
                    <li>Last week's conversations</li>
                    <li>Historical trends (2 years)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🌐 Source Diversity</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Reddit</li>
                    <li>Twitter/X</li>
                    <li>Dev.to, Hacker News</li>
                    <li>Custom domains</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📊 Result Calibration</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>10 targeted results</li>
                    <li>25 comprehensive insights</li>
                    <li>50 deep-dive analysis</li>
                  </ul>
                </div>
              </div>
              
              <Alert variant="default">
                <Lightbulb className="h-5 w-5" />
                <AlertTitle>Pro Insight</AlertTitle>
                <AlertDescription>
                  Combine filters strategically to uncover hidden insights that generic searches miss.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Enhanced Interactive Examples */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="examples">
                <Search className="mr-2 h-4 w-4" /> Example Queries
              </TabsTrigger>
              <TabsTrigger value="usecases">
                <Target className="mr-2 h-4 w-4" /> Use Case Strategies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="examples" className="space-y-4">
              {examples.map((example, index) => (
                <Card 
                  key={index} 
                  className={`
                    cursor-pointer transition-all 
                    ${activeExample === index 
                      ? 'border-primary shadow-lg' 
                      : 'hover:border-secondary-foreground/30'}
                  `}
                  onClick={() => setActiveExample(activeExample === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{example.title}</h3>
                        <p className="text-muted-foreground mb-3">{example.description}</p>
                        <div className="flex gap-2">
                          {example.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="bg-secondary px-2 py-1 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${
                              example.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                              example.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          `}>
                            {example.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {activeExample === index && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-secondary/50 p-4 rounded-lg border">
                          <p className="font-medium mb-2 flex items-center">
                            <Search className="mr-2 h-4 w-4" />
                            Example Query:
                          </p>
                          <code className="bg-secondary-foreground/10 px-3 py-2 rounded-md block">
                            {example.query}
                          </code>
                        </div>
                      
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="usecases" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase, index) => (
                <Card key={index} className="hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {useCase.icon}
                      <h3 className="font-semibold text-lg">{useCase.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{useCase.description}</p>
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Key Techniques:</h4>
                      <ul className="space-y-1 text-sm">
                        {useCase.techniques.map(tech => (
                          <li key={tech} className="flex items-center">
                            <ArrowRight className="mr-2 h-3 w-3 text-primary" />
                            {tech}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Alert>
                      <AlertTitle>Example Exploration</AlertTitle>
                      <AlertDescription>{useCase.example}</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Enhanced Pro Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6" /> 
                Pro Strategies for Intelligent Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">🎯 Query Crafting</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Precision over breadth</li>
                    <li>• Use specific, contextual language</li>
                    <li>• Incorporate domain-specific terminology</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">🔍 Search Optimization</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Layer multiple filters strategically</li>
                    <li>• Experiment with result volumes</li>
                    <li>• Cross-reference diverse sources</li>
                  </ul>
                </div>
              </div>
              <Alert variant="default">
                <AlertTitle>Continuous Learning</AlertTitle>
                <AlertDescription>
                  Each search is an opportunity to refine your research skills. Adapt and evolve your approach continuously.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QueryTutorialModal;