import React from 'react'
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative w-full pt-12 md:py-24 lg:py-32 xl:pt-48 overflow-hidden">
      {/* Grid background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e5e5 1px, transparent 1px),
            linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Fade overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, transparent 30%, white 100%)',
        }}
      />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
            Find Your Perfect{' '}
            <span className="inline-block bg-black text-white px-4 py-2 rounded-lg mt-2 sm:mt-0">
              Customers
            </span>
          </h1>
          <p className="max-w-[700px] text-lg text-gray-600 md:text-xl lg:text-2xl">
            Discover target users, find potential customers, and get social media insights to effectively promote your app. Our AI search engine for apps helps you connect with your audience and maximize app visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild className="bg-black text-white hover:bg-gray-800 group">
              <a href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild variant="outline" className="group">
              <a href="/login">
                Try Demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}