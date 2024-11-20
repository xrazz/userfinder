import React from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

function BlogPost() {
  return (
    <Card className="bg-[#f8f8f8] shadow-none border-none">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  How to Promote Your App Without Spending a Fortune
                </h2>
                <p className="text-xs text-muted-foreground mb-3">Oct 21, 2024</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover cost-effective strategies to promote your app and find initial users using UserFinder AI. Learn how to boost app downloads and engagement without breaking the bank.
                </p>
                <Link 
                  href="blogs/app-promotion"
                  className="text-primary text-sm font-medium inline-flex items-center hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="relative w-full h-48 md:h-full overflow-hidden rounded-lg">
              <Image
                src="/work.svg"
                alt="Analytics dashboard showing user demographics"
                layout="fill"
                // objectFit="cover"
                className="transition-transform hover:scale-105"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BlogsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* <h1 className="text-3xl font-bold text-center mb-8">Our Blog</h1> */}
      <BlogPost />
    </div>
  )
}

function Navbar() {
  return (
    <nav className="w-full border-none fixed top-0 left-0 z-50 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="UserFinder AI Logo" width={32} height={32} />
          <span className="font-semibold text-lg">Blog</span>
        </Link>
      </div>
    </nav>
  )
}

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-6 pt-16">
        <BlogsPage />
      </main>
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