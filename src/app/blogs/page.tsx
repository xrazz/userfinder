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
      <h1 className="text-3xl font-bold text-center mb-8">Our Blog</h1>
      <BlogPost />
    </div>
  )
}

function Navbar() {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© 2024 UserFinder AI. All rights reserved.</p>
        <nav className="flex justify-center gap-x-4 mt-2">
          <Link className="hover:underline underline-offset-4" href="/refund">Refund Policy</Link>
          <Link className="hover:underline underline-offset-4" href="/terms">Terms of Service</Link>
          <Link className="hover:underline underline-offset-4" href="/privacy">Privacy Policy</Link>
          <Link className="hover:underline underline-offset-4" href="/about">About Us</Link>
        </nav>
      </footer>
    </div>
  )
}