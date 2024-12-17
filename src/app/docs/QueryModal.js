'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Database, 
  Layers, 
  Search, 
  Zap, 
  Compass, 
  BookOpen, 
  PieChart, 
  Archive,
  HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const UniversalSearchTutorial = () => {
  const [activeExample, setActiveExample] = useState(null);
  const [activeTab, setActiveTab] = useState("capabilities");

  const searchCapabilities = [
    {
      icon: <Globe className="w-6 h-6 text-blue-500" />,
      title: "Comprehensive Information Retrieval",
      description: "Search across academic repositories, forums, social platforms, and deep web archives simultaneously",
      techniques: [
        "Multi-source aggregation",
        "Real-time content indexing",
        "Cross-platform insights"
      ]
    },
    {
      icon: <Database className="w-6 h-6 text-green-500" />,
      title: "Advanced Content Exploration",
      description: "Dive deep into specialized knowledge bases, from research papers to niche community discussions",
      techniques: [
        "Semantic search",
        "Context-aware results",
        "Intelligent content ranking"
      ]
    },
    {
      icon: <Layers className="w-6 h-6 text-purple-500" />,
      title: "Intelligent Information Synthesis",
      description: "Transform raw data into actionable insights with advanced analysis and correlation",
      techniques: [
        "AI-powered summarization",
        "Trend detection",
        "Credibility assessment"
      ]
    }
  ];

  const searchExamples = [
    {
      title: "Multidimensional Research",
      query: "Climate change impact on urban infrastructure",
      description: "Comprehensive exploration across scientific, policy, and community perspectives",
      complexity: "Advanced",
      domains: ["Academic", "Policy", "Community Discourse"]
    },
    {
      title: "Professional Ecosystem Insights",
      query: "Emerging technologies in renewable energy sector",
      description: "Synthesize insights from research, industry reports, and professional networks",
      complexity: "Expert",
      domains: ["Research", "Industry", "Professional Networks"]
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
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">Search Guide</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Universal Search Guide
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Compass className="w-7 h-7" />
            Universal Information Discovery
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="text-center bg-secondary/10 p-6 rounded-lg">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Beyond Traditional Search: Intelligent Information Retrieval
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Unlock comprehensive insights by searching across multiple knowledge ecosystems. Our universal search transcends traditional boundaries, connecting diverse information sources.
            </p>
          </div>

          {/* Tabs for Exploring Search Capabilities */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="flex flex-wrap justify-center mb-6">
              <TabsTrigger value="capabilities" className="flex-1 min-w-[150px]">
                <Zap className="mr-2 h-4 w-4" /> Search Capabilities
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex-1 min-w-[150px]">
                <BookOpen className="mr-2 h-4 w-4" /> Search Examples
              </TabsTrigger>
            </TabsList>

            {/* Capabilities Tab */}
            <TabsContent value="capabilities">
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4">
                {searchCapabilities.map((capability, index) => (
                  <Card key={index} className="hover:border-primary transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {capability.icon}
                        <h3 className="font-semibold text-lg">{capability.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{capability.description}</p>
                      <div>
                        <h4 className="font-medium mb-2">Key Techniques:</h4>
                        <ul className="space-y-1 text-sm">
                          {capability.techniques.map(tech => (
                            <li key={tech} className="flex items-center">
                              <PieChart className="mr-2 h-3 w-3 text-primary" />
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-4">
              {searchExamples.map((example, index) => (
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
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{example.title}</h3>
                        <p className="text-muted-foreground mb-3">{example.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {example.domains.map(domain => (
                            <span 
                              key={domain} 
                              className="bg-secondary px-2 py-1 rounded-full text-xs"
                            >
                              {domain}
                            </span>
                          ))}
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${
                              example.complexity === 'Advanced' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          `}>
                            {example.complexity}
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
                          <code className="bg-secondary-foreground/10 px-3 py-2 rounded-md block w-full overflow-x-auto">
                            {example.query}
                          </code>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Pro Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Archive className="w-6 h-6" /> 
                Advanced Search Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">🎯 Query Optimization</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Use precise, contextual language</li>
                    <li>• Incorporate domain-specific terminology</li>
                    <li>• Leverage advanced search operators</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">🔍 Content Navigation</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Explore cross-domain connections</li>
                    <li>• Verify information credibility</li>
                    <li>• Synthesize insights from multiple sources</li>
                  </ul>
                </div>
              </div>
              <Alert variant="default">
                <AlertTitle>Continuous Learning</AlertTitle>
                <AlertDescription>
                  Refine your search skills by experimenting with different approaches and exploring diverse knowledge ecosystems.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSearchTutorial;