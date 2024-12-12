// 'use client'

// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Check } from "lucide-react"

// export default function PricingPage() {
//   const router = useRouter()

//   return (
//     <div className="w-full pb-12 md:pb-24 lg:pb-32 bg-gray-50/50 dark:bg-gray-900/50">
//       <div className="container px-4 md:px-6">
//         <div className="relative w-full max-w-6xl mx-auto">
//           <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-lg bg-black hidden md:block" />
//           <Card className="relative w-full rounded-lg border bg-background">
//             <CardHeader className="text-center pb-2">
//               <div className="flex justify-center mb-4">
//                 <Badge variant="secondary" className="text-sm font-medium">
//                   Pricing
//                 </Badge>  
//               </div>
//               <CardTitle className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
//                 Choose Your Plan
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-gray-500 mt-4 mb-8 max-w-[600px] mx-auto text-center md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
//                 Select the plan that fits your needs. Upgrade or downgrade at any time.
//               </p>
//               <div className="grid gap-6 md:grid-cols-2 items-start">
//                 <Card className="flex flex-col justify-between h-full">
//                   <CardHeader>
//                     <CardTitle>Basic Plan</CardTitle>
//                   </CardHeader>
//                   <CardContent className="flex-grow">
//                     <p className="text-3xl font-bold mb-4">$11<span className="text-lg font-normal text-gray-500">/mo</span></p>
//                     <ul className="space-y-2">
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 300 searches per month</li>
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> AI-powered insights</li>
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> User analytics</li>
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Email support</li>
//                     </ul>
//                     <Button className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800">Choose Basic</Button>
//                   </CardContent>
//                 </Card>
//                 <Card className="flex flex-col justify-between h-full">
//                   <CardHeader>
//                     <CardTitle>Pro Plan</CardTitle>
//                   </CardHeader>
//                   <CardContent className="flex-grow">
//                     <p className="text-3xl font-bold mb-4">$29<span className="text-lg font-normal text-gray-500">/mo</span></p>
//                     <ul className="space-y-2">
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited searches</li>
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> AI-powered insights</li>
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> User analytics</li>
//                       <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Priority support</li>
//                     </ul>
//                     <Button className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800">Choose Pro</Button>
//                   </CardContent>
//                 </Card>
//               </div>
//               <div className="mt-8 text-center text-sm text-gray-500">
//                 <p>All plans come with a 7-day money-back guarantee. No questions asked.</p>
//                 <p className="mt-2">
//                   By subscribing, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }


import { Building, Check, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "./badge"

export default function Component() {
  return (
    <div id="pricing" className="container mx-auto px-4 py-12 mb-14 w-full md:max-w-4xl">
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200">
            Pricing
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Perfect plans to get started</h1>
        <p className="text-gray-500 text-sm dark:text-gray-400 max-w-2xl">
          We’ve got flexible pricing plans to suit your needs find the perfect one and get started with everything you love!
        </p>


      </div>

      <Card className="mt-8 bg-gray-100 dark:bg-gray-800/50 shadow-none border-none">
        <CardContent className="p-6 sm:p-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Starter Tier */}
          <div className="bg-white p-4">
            <div className="mb-4">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="font-medium mb-1">Starter</h3>
              <div className="text-2xl font-bold">$10</div>
              <p className="text-xs text-muted-foreground">per month</p>
              <p className="text-sm text-muted-foreground mt-2">For individuals and small businesses </p>
            </div>
            <a href="/checkout">   
            <Button  className="w-full mb-6">Get started</Button>
            </a>
            <ul className="space-y-2 list-disc m-4 text-sm">
              <li>Unlimited searches per month</li>
              <li>Search only popular platforms (Reddit, Quora, Twitter, etc.)</li>
              <li>Max 25 results per search</li>
              <li>Access to date filters for recent conversations (e.g., last 24 hours, last week)</li>
              <li>Pre-made prompts for validation & research</li>
              {/* <li>Custom websites</li>
              <li>Custom automations</li>
              <li>Charts & dashboards</li> */}
            </ul>
          </div>

          {/* Business Tier */}
          <div className="bg-white p-4 relative">

            <div className="absolute   right-4  px-3 py-1 rounded-full text-xs">
              <Badge color="red" >
                Popular

              </Badge>
            </div>
            <div className="mb-4">
              <Building className="w-8 h-8 mb-2" />
              <h3 className="font-medium mb-1">Business</h3>
              <div className="text-2xl font-bold">$29</div>
              <p className="text-xs text-muted-foreground">per seat/month</p>
              <p className="text-sm text-muted-foreground mt-2">For growing businesses to enterprises </p>
            </div>
            <a href="/checkout">   
            <Button  className="w-full mb-6">Get started</Button>
            </a>
            
            <p className="text-sm font-medium mb-2">Everything in Starter +</p>
            <ul className="space-y-2 list-disc m-4 text-sm">
              <li>Custom domain crawling (e.g., Facebook, LinkedIn, or your own websites)</li>
              <li>50 results per search</li>
              <li>Dedicated support for feature requests</li>
              <li>Ideal for market validation and targeting niche communities</li>
              {/* <li>90 day page history</li>
              <li>Invite 250 guests</li> */}
            </ul>
          </div>
        </div>
        </CardContent>
      </Card>

    </div>
  )
}
