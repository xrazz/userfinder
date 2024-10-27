import Head from 'next/head'
import Hero from "@/components/ui/hero"
import Features from "@/components/ui/Features"
import HowItWorks from "@/components/ui/howitworks"
import Pricing from "@/components/ui/pricing"
import FAQ from "@/components/ui/faq"
import CallToAction from "@/components/ui/cta"
import Header from "@/components/ui/header"
import Script from 'next/script'
import DemoVideo from '@/components/ui/demoVideo'
 

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
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Header />
        <main className="flex-1 pt-16 md:pt-0">
          <Hero />
          <DemoVideo />
          {/* <HeroScrollDemo/> */}
          <Features />
          <HowItWorks />
          <Pricing />
          <FAQ />
          <CallToAction />
        </main>
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 UserFinder AI by Qunaternity Technologies Private Limited All rights reserved.</p>
         <p className="text-xs text-gray-500 dark:text-gray-400">CIN - U62013MP2024PTC069972</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <a className="text-xs hover:underline underline-offset-4" href="/refund">
              Refund Policy
            </a>
            <a className="text-xs hover:underline underline-offset-4" href="/terms">
              Terms of Service
            </a>
            <a className="text-xs hover:underline underline-offset-4" href="/privacy">
              Privacy Policy
            </a>
            <a className="text-xs hover:underline underline-offset-4" href="/about">
              About Us
            </a>
          </nav>
        </footer>
      </div>
    </>
  )
}
