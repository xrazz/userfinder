import React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

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

function TermsOfUsePage({ className, ...props }: CardProps) {
  return (
    <div>
    <Card className={cn("w-full border-none max-w-4xl mx-auto shadow-none", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Terms of Use</CardTitle>
        <CardDescription>Effective Date: October 3, 2024</CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to UserFinder.online! By using our website and services, you agree to comply with and be bound by the following terms and conditions. Please review these carefully. If you do not agree with these terms, you should not use our website or services.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground">
            By accessing and using UserFinder.online (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Use and our Privacy Policy. These terms apply to all users of the Service.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Service Description</h2>
          <p className="text-sm text-muted-foreground">
            UserFinder.online is an AI-powered search tool designed to help SaaS founders and marketers discover real-time conversations and user needs across various platforms. By signing up for the Service, you will be able to perform unlimited searches for relevant user discussions for a fixed monthly fee of $10.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3. Account Creation and Google Login</h2>
          <p className="text-sm text-muted-foreground">
            You may only access UserFinder.online using Google login. By logging in with your Google account, you authorize us to access certain Google account information, such as your name and email address, in compliance with our Privacy Policy. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">4. Subscription and Billing</h2>
          <p className="text-sm text-muted-foreground">
            UserFinder.online operates on a subscription basis. The fee is $10/month for unlimited searches. Payments will be processed through a third-party payment gateway. You are responsible for ensuring that your payment information is accurate and up to date. You may cancel your subscription at any time, but no refunds will be provided after the 7-day satisfaction guarantee period.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">5. Use of Service</h2>
          <p className="text-sm text-muted-foreground">
            You agree to use the Service only for lawful purposes and in compliance with all applicable laws and regulations. You are not allowed to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Misuse or interfere with the proper functioning of the Service.</li>
            <li>Attempt to access unauthorized areas of the Service or the accounts of other users.</li>
            <li>Resell or redistribute the Service without explicit written consent from UserFinder.online.</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground">
            All content, branding, and software on UserFinder.online are the property of UserFinder.online or its licensors. You may not copy, modify, distribute, or create derivative works based on our intellectual property without our explicit permission.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground">
            We provide the Service &quot;as is&quot; and make no warranties regarding the accuracy, reliability, or availability of the Service. To the fullest extent permitted by law, UserFinder.online shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">8. Changes to Terms</h2>
          <p className="text-sm text-muted-foreground">
            We may update these Terms of Use from time to time. If we make significant changes, we will notify you by posting the updated terms on our website or through other communication methods.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">9. Termination</h2>
          <p className="text-sm text-muted-foreground">
            We reserve the right to terminate or suspend access to the Service for any reason, including violation of these terms.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Link href="/login" className="w-full md:w-auto">
          <Button className="w-full md:w-auto">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
    <footer>
        <div className="px-4 md:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-2 md:space-y-0">
            <p className="text-sm text-muted-foreground">© 2024 UserFinder AI. All rights reserved.</p>
            <nav className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 mt-2 md:mt-0">
              <Link className="text-sm hover:underline underline-offset-4" href="/refund">
                Refund Policy
              </Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>
            </nav>
          </div>
          <Link
            href="https://x.com/holamejessie"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 fill-current text-white"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="sr-only">Follow on X</span>
          </Link>
        </div>
      </footer>
    </div>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-none fixed top-0 left-0 z-50 px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={40} height={40} />
          <span className="font-bold text-lg">Terms of Use</span>
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
        <TermsOfUsePage />
      </main>
    </div>
  )
}

export default Page