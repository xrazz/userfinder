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
          {/* <AnimatedSection>    */}
            {/* <Pricing /> */}
          {/* </AnimatedSection> */}
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
              href="https://www.linkedin.com/in/suraj-tripathi-92a042273"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
            >
              <svg width="98" height="98" viewBox="0 0 98 98" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.5245 0H27.3917C12.2637 0 0 12.2653 0 27.3953V70.5336C0 85.6636 12.2637 97.9289 27.3917 97.9289H70.5245C85.6525 97.9289 97.9162 85.6636 97.9162 70.5336V27.3953C97.9162 12.2653 85.6525 0 70.5245 0Z" fill="#2967B0" />
                <path d="M52.0077 43.6589C52.6834 42.901 53.2403 42.1248 53.9434 41.4673C56.0799 39.4492 58.6182 38.4356 61.5765 38.4538C63.2018 38.4721 64.8088 38.5817 66.3701 39.0383C69.9493 40.0701 72.0402 42.5448 73.0263 46.0423C73.775 48.6723 73.9119 51.3661 73.9119 54.0691C73.9211 59.7765 73.8937 65.4747 73.9119 71.182C73.9119 71.7117 73.7659 71.8578 73.2363 71.8486C70.2962 71.8213 67.3562 71.8213 64.4253 71.8486C63.9048 71.8486 63.7953 71.6934 63.7953 71.2003C63.8135 65.776 63.8135 60.3426 63.7953 54.9184C63.7953 53.5577 63.704 52.1971 63.3205 50.873C62.6174 48.4348 60.8735 47.1929 58.3261 47.3299C54.8382 47.5125 53.0303 49.2384 52.5829 52.7815C52.4734 53.6308 52.4277 54.4709 52.4277 55.3293C52.4277 60.6075 52.4277 65.8856 52.446 71.1638C52.446 71.6934 52.3181 71.8486 51.7794 71.8395C48.8211 71.8121 45.8628 71.8121 42.9045 71.8395C42.4297 71.8395 42.2928 71.7117 42.2928 71.2368C42.3019 60.7901 42.3019 50.3342 42.2928 39.8875C42.2928 39.367 42.4571 39.2483 42.9502 39.2574C45.7624 39.2757 48.5746 39.2848 51.3777 39.2574C51.8981 39.2574 52.026 39.4218 52.0168 39.9058C51.9894 41.1568 52.0077 42.4079 52.0077 43.6498V43.6589Z" fill="#FDFDFD" />
                <path d="M35.9105 55.6032C35.9105 60.7718 35.9105 65.9404 35.9196 71.109C35.9196 71.6843 35.7827 71.8578 35.1801 71.8486C32.24 71.8121 29.3091 71.8212 26.3691 71.8486C25.8943 71.8486 25.7573 71.7299 25.7573 71.2459C25.7756 60.7809 25.7665 50.316 25.7573 39.8418C25.7573 39.4127 25.8578 39.2574 26.3234 39.2574C29.3 39.2757 32.2857 39.2848 35.2622 39.2574C35.8375 39.2574 35.9105 39.4766 35.9105 39.9606C35.8923 45.1748 35.9105 50.389 35.9105 55.5941V55.6032Z" fill="#FDFDFD" />
                <path d="M36.7231 28.8929C36.7231 32.1346 34.0935 34.7829 30.8522 34.7829C27.6565 34.7829 24.9995 32.1346 24.9903 28.9385C24.9812 25.7059 27.6382 23.0486 30.8704 23.0486C34.0753 23.0486 36.7231 25.6876 36.7231 28.8837V28.8929Z" fill="#FDFDFD" />
              </svg>


              <span className="sr-only">Follow on LinkdIn</span>
            </Link>
          </div>
        </motion.footer>
      </motion.div>
    </>
  )
}
