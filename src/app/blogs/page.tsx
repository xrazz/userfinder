import React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

function BlogCard({ title, description, date, imageUrl }: { title: string; description: string; date: string; imageUrl: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <div className="relative h-48 group">
        <Image
          src={imageUrl}
          alt={title}
          // layout="fill"
          objectFit="cover"
          width={400}
          height={200}
          className="rounded-t-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <Link href="blogs/app-promotion" > 
         <Button variant="secondary" className="text-white bg-transparent hover:bg-white hover:text-black border border-white">
            Read More
          </Button>
         
         </Link>
          
        </div>
      </div>
      <div className="flex flex-col flex-grow p-6 bg-white">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{date}</p>
        <p className="text-gray-600 mb-6 flex-grow">{description}</p>
        <Button asChild variant="default" className="w-full bg-black hover:bg-gray-800 text-white">
          <Link href="blogs/app-promotion" className="inline-flex items-center justify-center">
            Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function BlogsPage() {
  const blogs = [
    {
      title: "How to Promote Your App Without Spending a Fortune | UserFinder AI",
      description: "Discover cost-effective strategies to promote your app and find initial users using UserFinder AI. Learn how to boost app downloads and engagement without breaking the bank.",
      date: "Oct 21, 2024",
      imageUrl: "/pormotion.svg"
    },
    // {
    //   title: "5 Strategies to Leverage User Feedback for Product Growth",
    //   description: "Learn how to turn user conversations into actionable insights that drive your SaaS product's development and growth.",
    //   date: "May 10, 2024",
    //   imageUrl: "/placeholder.svg?height=200&width=400"
    // },
    // {
    //   title: "The Power of Community-Driven Marketing for SaaS",
    //   description: "Explore how engaging with online communities can supercharge your SaaS marketing efforts and lead to sustainable growth.",
    //   date: "May 5, 2024",
    //   imageUrl: "/placeholder.svg?height=200&width=400"
    // }
  ]

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">UserFinder.online Blog</h1>
        <p className="text-xl text-gray-600">
          Insights, tips, and strategies to help you grow your SaaS business
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog, index) => (
          <BlogCard key={index} {...blog} />
        ))}
      </div>
      
       
    </div>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
          <span className="font-bold text-lg">Blog</span>
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
        <BlogsPage />
      </main>
    </div>
  )
}