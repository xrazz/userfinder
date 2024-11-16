import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function WhatWhyHow() {
  const features = [
    {
      title: "What is Userfinder ai?",
      description: "Userfinder ai is an AI-powered search tool designed to help you find real-time conversations across platforms like Reddit, Twitter, Quora, Stack Exchange, and more. It's perfect for discovering niche-specific discussions and identifying potential users who are actively seeking solutions or products like yours.",
      image: "/what.svg"
    },
    {
      title: "How can userfinder ai help me get early users or customers?",
      description: "With userfinder ai, you can set date filters to find conversations posted within the last 24 hours. This lets you quickly identify real-time discussions where people are actively seeking solutions like yours. You can jump into these conversations to introduce your product, helping you acquire early users faster and build traction for your brand.",
      image: "/how.svg"
    },
    {
      title: "Why should I use userfinder ai instead of manually searching on platforms like Google, Reddit, or Quora?",
      description: "Manually searching on platforms like Google, Reddit, Twitter, and Quora can be time-consuming and often frustrating. These platforms usually show years-old, inactive discussions still topping the results, which aren't useful if you're looking to find active conversations or potential users. Userfinder.ai automates this process, crawling multiple platforms simultaneously and using AI to surface only fresh, highly relevant conversations. This saves you time and effort, allowing you to engage with users who are currently talking about topics related to your niche.",
      image: "/why.svg"
    },
    {
      title: "Why should I pay $29 when I can search on these platforms for free?",
      description: "While you can manually search on these platforms for free, those searches often bring up outdated results. For example, platforms like Google or Reddit may show you discussions that are years old and no longer relevant, making it difficult to find current conversations where people are actively looking for solutions. Userfinder ai solves this by providing up-to-date, targeted results with advanced filters. For $10, you get unlimited searches on popular platforms, and for $29, you can crawl custom domains, allowing you to find niche conversations that are happening right now. This investment saves you hours of manual effort and helps you get early potential users more effectively and easily.",
      image: "/win.svg"
    } 
  ]

  return (
    <div id="features" className="container mx-auto px-4 py-12 mb-14 w-full md:max-w-4xl">
    {/* <div className="container mx-auto px-4 py-12"> */}
      <div className="text-center mb-8">
      <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
          Features
        </Badge>
        <h1 className=" text-2xl font-bold tracking-tight md:text-3xl mt-6 mb-2">What, Why & How?</h1>
      </div>
      <Card className="w-full bg-gray-100 shadow-none border-none">
        <CardContent className="p-0">
          {features.map((feature, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 p-6 ${index !== features.length - 1 ? 'border-b border-none' : ''}`}>
              <div className="flex-1 space-y-4">
                <h3 className="font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600  ">
                  {feature.description}
                </p>
              </div>
              <div className="flex-1 flex justify-center items-center">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={300}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}