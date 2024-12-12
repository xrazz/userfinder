'use client'

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


function PricingPlanPage({ className, ...props }: React.ComponentProps<typeof Card>) {

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Simple Pricing. Unlimited Access.</CardTitle>
        <CardDescription>At UserFinder.online, we offer one plan with everything you need no hidden fees or confusing tiers.</CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="bg-primary/5 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Unlimited Plan</h2>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold">₹825/month<span className="text-2xl font-normal"> ($10 USD/month)</span></p>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Unlimited Searches: Across Reddit, Twitter, Quora, GitHub, and more.</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>AI Insights: Find real-time discussions relevant to your SaaS.</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Community Discovery: Uncover the right user conversations.</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Direct Engagement: Connect with potential users instantly.</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Easy Access: Google login for fast, secure use.</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <Link href="/login" className="block w-full">
            <Button className="w-full text-lg">
              Get Plan
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Why UserFinder.online?</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>No Hidden Fees: Just ₹825/month ($10 USD), no extra charges.</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Cancel Anytime: No long-term commitments.</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>7-Day Guarantee: Full refund if not satisfied in 7 days.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
          <span className="font-bold text-lg">Pricing</span>
        </div>
      </div>
    </nav>
  )
}

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-8 pt-20">
        <PricingPlanPage />
      </main>
    </div>
  )
}