import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Infinity, TrendingUp, Users, MessageSquare, LogIn, Layout, Smartphone } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CardProps = React.ComponentProps<typeof Card>

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <Card className="flex flex-col items-center text-center p-6">
      <Icon className="h-12 w-12 mb-4 text-primary" />
      <CardTitle className="text-xl mb-2">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </Card>
  )
}

function FeaturesPage({ className, ...props }: CardProps) {
  const features = [
    {
      icon: Search,
      title: "AI-Powered Search",
      description: "Easily find relevant conversations across multiple platforms like Reddit, Twitter, Quora, and GitHub, with just one search."
    },
    {
      icon: Infinity,
      title: "Unlimited Searches",
      description: "No limits—search as much as you need for one flat monthly fee."
    },
    {
      icon: TrendingUp,
      title: "Real-Time Insights",
      description: "Stay ahead with the latest user discussions and trends relevant to your SaaS niche."
    },
    {
      icon: Users,
      title: "Community Discovery",
      description: "Uncover niche communities discussing the exact problems your SaaS solves."
    },
    {
      icon: MessageSquare,
      title: "Direct Engagement",
      description: "Engage with users by responding to their posts and sharing your solution directly."
    },
    {
      icon: LogIn,
      title: "Google Login Integration",
      description: "One-click login via Google for fast, secure access."
    },
    {
      icon: Layout,
      title: "User-Friendly Interface",
      description: "Easily navigate and find insights without technical hassle."
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Access our platform anytime, anywhere with a mobile-friendly interface."
    }
  ]

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Discover Powerful Features to Grow Your SaaS</CardTitle>
        <CardDescription>
          UserFinder.online offers everything you need to connect with the right users and communities. Check out our top features below:
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-lg font-medium mb-4">
            Get started with these powerful tools to accelerate your SaaS growth!
          </p>
          <Link href="/login" className="block w-full md:w-auto md:inline-block">
            <Button className="w-full md:w-auto text-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
          <span className="font-bold text-lg">Features</span>
        </div>
         
      </div>
    </nav>
  )
}

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-8 pt-20">
        <FeaturesPage />
      </main>
    </div>
  )
}

export default Page