'use client'

import { useState, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Copy, Search } from "lucide-react"
import { Toaster, toast } from 'sonner'

const categories = [
  {
    title: "Customer Insights and Pain Points",
    queries: [
      "Common challenges faced by [target audience] in [industry]",
      "Biggest frustrations with [product category/competitor]",
      "Top 5 unmet needs in [industry/product category]",
      "Why customers switch from [competitor]",
      "What customers wish [competitor] had",
      "Key pain points in [industry] that need solving",
      "Why people abandon [product/service]",
      "Customer expectations in [product category]",
      "Customer opinions on [product category] limitations",
      "Disliked aspects of [competitor] in user reviews",
      "What customers are looking for in [product]",
      "Top issues users face with [product category]",
      "Reasons customers choose [competitor]",
      "Biggest pain points in [product category]",
      "User frustrations with [competitor's product]",
      "Challenges with current solutions in [industry]",
      "Desired features that users feel are missing in [product category]",
      "User complaints on common features in [product category]",
      "How customers describe [competitor]'s shortcomings",
      "What customers need vs. what they get in [product category]"
    ]
  },
  {
    title: "Market Trends and Demand Analysis",
    queries: [
      "Current demand for [product category] in 2024",
      "Future of [product category] in [target industry]",
      "Is there a market for [new product idea]?",
      "Growing demand for [type of product] in [industry]",
      "Key industry trends for [product category]",
      "Changing customer expectations in [industry]",
      "Growth projections for [product category]",
      "Shifts in consumer behavior in [industry]",
      "New trends impacting [industry] in 2024",
      "Drivers of growth in [product category]",
      "Consumer interest in innovative [product category] features",
      "Market size projections for [product category]",
      "Technological advances influencing [industry]",
      "Influential factors in [industry] trends",
      "What's gaining traction in [product category]",
      "Macro trends affecting [industry]",
      "Top innovations in [product category]",
      "Key factors driving growth in [industry]",
      "Regional demand trends for [product category]",
      "Predicted changes in [product category] by 2025"
    ]
  },
  {
    title: "Competitor Analysis",
    queries: [
      "Why people choose [competitor] over others",
      "Best alternatives to [competitor/product]",
      "User preferences between [competitor] and [competitor]",
      "Pros and cons of [competitor/product]",
      "Competitor weaknesses in [product category]",
      "Feature gaps in [competitor/product]",
      "Strengths and weaknesses of top [industry] players",
      "Key differentiators between [competitor] and [competitor]",
      "Why users switch from [competitor]",
      "Most requested features in [competitor's product]",
      "User opinions comparing [competitor] and [competitor]",
      "Top-rated alternatives to [competitor]",
      "Competitor feature comparison in [product category]",
      "Why [competitor] is popular among users",
      "Common complaints about [competitor's product]",
      "Feature parity between [competitor] and others",
      "What [competitor] does better than others",
      "How competitors stack up on customer satisfaction",
      "Why [competitor] is losing users to alternatives",
      "Customer reviews highlighting [competitor]'s weaknesses"
    ]
  },
  {
    title: "Pricing and Willingness to Pay",
    queries: [
      "How much would you pay for [product feature/benefit]?",
      "Price expectations for [product category]",
      "Average cost for [product category]",
      "Willingness to pay survey for [product feature]",
      "Cost of premium features in [product category]",
      "Price sensitivity for [product category] features",
      "How much users spend on [product category]",
      "Perceived value of [premium feature] by users",
      "What price ranges do customers expect for [product]?",
      "Ideal budget for [target audience] for [product]",
      "Customer price tolerance for [product category]",
      "How much would users pay to avoid ads in [product]",
      "Preferred price range for [product category] subscription",
      "Impact of price changes on [product] demand",
      "Factors influencing price expectations in [industry]",
      "Feedback on pricing options for [product category]",
      "Customer opinions on freemium vs premium [product]",
      "Survey: willingness to pay for enhanced features in [product category]",
      "How important is pricing compared to quality in [industry]",
      "Price points at which users switch from [competitor]"
    ]
  },
  {
    title: "Product Validation and Testing",
    queries: [
      "Do people need a [product] for [niche/category]?",
      "Is there a need for a [product] in the [niche/category] market?",
      "Do [target audience] in [category] need [product type]?",
      "Is [product idea] relevant to [specific target market]?",
      "Would [product] solve a problem in [niche or industry]?",
      "Do users feel a need for [product type] in [industry]?",
      "Would people pay for [product] in [specific niche]?",
      "Do [target market] need [product idea]?",
      "Interest validation for [product] in [niche]",
      "Getting feedback on [product] usability for [specific group]",
      "How to check if [target audience] needs [product type]",
      "Interest levels in [product category] for [specific group or industry]",
      "Is there a gap for [product type] in [category or industry]?",
      "How people in [category] view [product concept]",
      "Gathering insights on MVP [product] for [niche]",
      "Key insights from beta testing [product category]",
      "Would users in [niche] find value in [product idea]?",
      "What early adopters in [niche] want in [product]",
      "Top strategies for beta testing [product category] in [niche]",
      "Best MVP examples for [product category]"
    ]
  },
  {
    title: "Pre-launch Strategies and Interest Building",
    queries: [
      "How to attract beta testers for [product category]",
      "Pre-launch hype strategies for [product]",
      "Building initial user interest for [product]",
      "Effective ways to promote a new [product]",
      "Building a waitlist for [product] launch",
      "Getting influencers to test [product]",
      "Generating buzz for [product launch]",
      "Building a mailing list for [product] pre-launch",
      "Strategies for creating demand before [product] launch",
      "How to drive interest in new [product category]",
      "Creating a sense of exclusivity for [product] launch",
      "User acquisition strategies before [product] launch",
      "How to leverage social media for [product] pre-launch",
      "Setting up referral programs for [product] pre-launch",
      "Ways to engage potential users before launch",
      "Tips for building anticipation for [product] release",
      "Using feedback loops to refine pre-launch strategy",
      "How to create a strong brand identity pre-launch",
      "How to approach partnerships before [product] release",
      "Getting user testimonials for early [product] version"
    ]
  }
];

export default function Component() {
  const [searchTerm, setSearchTerm] = useState('')

  const searchResults = useMemo(() => {
    if (searchTerm.trim() === '') {
      return categories
    }
    return categories.filter(category => 
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.queries.some(query => query.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [searchTerm])

  const handleCopy = (query: string) => {
    navigator.clipboard.writeText(query).then(() => {
      toast.success('Query copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy. Please try again.')
    })
  }

  return (
    <div className='w-full max-w-3xl mx-auto px-3 py-8'>    


    <div className="container mx-auto p-4 max-w-full lg:max-w-6xl">
      <Toaster position="bottom-right" />
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-center mb-3">
            Search Queries
          </h1>
          <p className="text-center mb-5 text-muted-foreground">Market Research Query Search</p>
      {/* <h1 className="text-3xl font-bold mb-6">Market Research Query Search</h1> */}
      <div className="mb-8 relative">
        <Input
          type="search"
          placeholder="Search for queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
      </div>
      <div className="space-y-8">
        {searchResults.map((category, index) => (
          <Card key={index} className="border-none shadow-none bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-primary">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {category.queries.map((query, queryIndex) => (
                  <li key={queryIndex} className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <pre className="flex-grow bg-muted p-3 rounded-md overflow-x-auto w-full sm:w-auto">
                      <code className="text-sm whitespace-pre-wrap text-foreground">{query}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(query)}
                      className="shrink-0 mt-2 sm:mt-0 w-full sm:w-auto"
                      aria-label={`Copy query: ${query}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </div>
  )
}