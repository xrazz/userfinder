'use client'

import { useEffect, ReactNode } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { motion, useAnimation, Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

import Header from "@/components/ui/header"
import Hero from "@/components/ui/hero"
import DemoVideo from '@/components/ui/demoVideo'
import Features from "@/components/ui/Features"
import HowItWorks from "@/components/ui/howitworks"
import Pricing from "@/components/ui/pricing"
import FAQ from "@/components/ui/faq"
import CallToAction from "@/components/ui/cta"
import Link from 'next/link'
import { createGoogleDork } from './search/dorkingQuery'
import WhatWhyHow from '@/components/ui/whatWhyHow'


const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

interface AnimatedSectionProps {
  children: ReactNode;
}

function AnimatedSection({ children }: AnimatedSectionProps) {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={fadeInUp}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {

  const description = "UserFinder AI: The ultimate AI-powered user finder and app promotion tool. Discover target users, gain social media insights, and effectively promote your app on platforms like Reddit, Quora, and Twitter. Enhance user discovery, engage potential customers, and maximize your app's visibility with our market research and competitive analysis tools."
  const keywords = "App Promotion Tool, AI-Powered User Finder, Discover Target Users, Find Potential Customers, Social Media Insights, Market Research Tool, Targeted Marketing Solutions, User Acquisition Platform, Audience Engagement Insights, Promote Your App Effectively, AI Search Engine for Apps, Identify Interested Users, Connect with Your Audience, Enhance User Discovery, Find Your App Users, Engage with Potential Customers, Search Engine for App Users, User Feedback and Insights, Competitive Analysis Tool, Promote Your Fitness App, Target Users on Reddit Quora Twitter, Bookmark User Conversations, Connect with Fitness Enthusiasts, Maximize App Visibility, Find Conversations About Your App"

  return (
    <>
      <Head>
        <title>UserFinder AI | AI-Powered App Promotion & User Discovery Tool</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://userfinder.online" />
        <meta property="og:title" content="UserFinder AI | AI-Powered App Promotion & User Discovery Tool" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://userfinder.online" />
        <meta property="og:image" content="https://userfinder.online/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="UserFinder AI | AI-Powered App Promotion & User Discovery Tool" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://userfinder.online/twitter-image.jpg" />
      </Head>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "UserFinder AI",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "10",
              "priceCurrency": "USD"
            },
            "operatingSystem": "Web",
            "description": description,
            "url": "https://userfinder.online",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1024"
            }
          })
        }}
      />
      <motion.div
        className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Header />
        <main className="flex-1 pt-16 md:pt-0">
          <AnimatedSection>
            <Hero />
          </AnimatedSection>
          <AnimatedSection>
            <DemoVideo />
          </AnimatedSection>
          <AnimatedSection >
            <WhatWhyHow />
          </AnimatedSection>
          <AnimatedSection >
            <Features />
          </AnimatedSection>
          <AnimatedSection>
            <HowItWorks />
          </AnimatedSection>
          <AnimatedSection>
            <Pricing />
          </AnimatedSection>
          <AnimatedSection>
            <FAQ />
          </AnimatedSection>
          <AnimatedSection>
            <CallToAction />
          </AnimatedSection>
        </main>
        <motion.footer
          className="border-t"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
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
        </motion.footer>
      </motion.div>
    </>
  )
}