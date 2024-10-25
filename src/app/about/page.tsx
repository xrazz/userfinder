import React from "react"
import Image from "next/image"
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
 

type CardProps = React.ComponentProps<typeof Card>

function AboutPage({ className, ...props }: CardProps) {
 

 
  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">About UserFinder AI</CardTitle>
        <CardDescription>Your Gateway to SaaS Growth</CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="text-sm text-muted-foreground">
              To bridge the gap between SaaS creators and the communities discussing the exact problems their product solves.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">What We Offer</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>AI-powered search across multiple platforms</li>
              <li>Actionable insights for SaaS founders</li>
              <li>Direct access to relevant user discussions</li>
              <li>Affordable pricing at just $10/month</li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Why Choose UserFinder AI?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Simplify Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Streamline your process of finding and engaging with potential users.</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Affordable Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Unlimited searches for a flat monthly fee, with no hidden costs.</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Intuitive Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Easy-to-use interface designed for founders and marketers.</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Get in Touch</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">contact@userfinder.online</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" /> Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">+91 81413-71777</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">80/2a Saket Nagar, Bhopal City, 462024</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <a className="w-full md:w-auto" href="./contact"> 

        <Button className="w-full md:w-auto">
          Contact Us <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        </a>
        
      </CardFooter>
    </Card>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
          <span className="font-bold text-lg">About Us</span>
        </div>
        {/* <span className="text-lg font-semibold">About Us</span> */}
      </div>
    </nav>
  )
}

const Page = () => {
  return (
    <main className="flex-grow flex flex-col items-center justify-center p-8 pt-20">
      <Navbar />
      <AboutPage />
    </main>
  )
}

export default Page