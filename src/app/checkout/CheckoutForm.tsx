'use client'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Users, Building, Search, ArrowRight } from "lucide-react"
import { Badge } from "@radix-ui/themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import router from "next/router"
import Link from "next/link"

interface CheckoutFormProps {
  mail: string;
}
export default function Component() {
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Function to handle redirection with payment options
  const handleGetStarted = (plan: string) => {
    if (isMounted) {
      router.push(`/payment?plan=${plan}`)
    }
  }

  return (
    <section className="px-4 py-4 bg-background">
      <Navbar />
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground mb-6">
            🪄 Meet the new UserFinder AI
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">One tool to get your business started.</h1>
          <p className="text-2xl md:text-3xl font-bold text-muted-foreground">Starter plan for individuals.</p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Starter Tier */}
          <div className="bg-[#f8f8f8] p-4">
            <div className="mb-4">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="font-medium mb-1">Starter</h3>
              <div className="text-2xl font-bold">$10</div>
              <p className="text-xs text-muted-foreground">per month</p>
              <p className="text-sm text-muted-foreground mt-2">For individuals and small businesses</p>
            </div>
            <Button
              className="w-full mb-6"
              variant="default"
              onClick={() => handleGetStarted("BASIC")}
            >
              Get started
            </Button>
            <ul className="space-y-2 list-disc m-4 text-sm">
              <li>Unlimited searches per month</li>
              <li>Search across only popular platforms (Reddit, Quora, Twitter, etc.)</li>
              <li>Max 25 results per search</li>
              <li>Access to date filters for recent conversations (e.g., last 24 hours, last week)</li>
              <li>Pre-made prompts for validation & research</li>
            </ul>
          </div>

          {/* Business Tier */}
          <div className="bg-[#f8f8f8] p-4 relative">
            <div className="absolute right-4 px-3 py-1 rounded-full text-xs">
              <Badge color="red" size="2">
                Popular
              </Badge>
            </div>
            <div className="mb-4">
              <Building className="w-8 h-8 mb-2" />
              <h3 className="font-medium mb-1">Business</h3>
              <div className="text-2xl font-bold">$29</div>
              <p className="text-xs text-muted-foreground">per seat/month</p>
              <p className="text-sm text-muted-foreground mt-2">For growing businesses to enterprises</p>
            </div>
            <Button
              className="w-full mb-6"
              onClick={() => handleGetStarted("PRO")}
            >
              Get started
            </Button>
            <p className="text-sm font-medium mb-2">Everything in Starter +</p>
            <ul className="space-y-2 list-disc m-4 text-sm">
              <li>Custom domain crawling (e.g., Facebook, LinkedIn, or your own websites)</li>
              <li>50 results per search</li>
              <li>Dedicated support for feature requests</li>
              <li>Ideal for market validation and targeting niche communities</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-none fixed top-0 left-0 z-50 pt-2 pl-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="UserFinder AI Logo" width={30} height={30} />
          <span className="font-bold text-lg">Checkout</span>

        </div>

        <div className="flex items-center space-x-4 mr-2">
         <Link href='/search'>
            <Button
              variant="secondary"
            
              className="rounded-full"
            >
              
              Go to Search <ArrowRight className="transition-transform group-hover:translate-x-1" />
          

             
            </Button>
            </Link>
          </div>
      </div>
    </nav>
  )
}
