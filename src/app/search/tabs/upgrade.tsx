import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation";

export default function UpgradePage({ premium = false }: { premium?: boolean }) {
  if (premium) {
    return null; // Don't show pricing plans for premium users
  }
  const router = useRouter()
  return (
    <div className="bg-white min-h-screen py-1 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            UserFinder.online AI Pricing
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Unlock the power of AI-driven market research and targeted user discovery across the internet.
          </p>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          <Card className="relative border-primary">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-3.5  bg-primary text-primary-foreground text-sm font-semibold py-1 px-3 rounded-full">
              Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Pro Plan</CardTitle>
              <CardDescription>For comprehensive research needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">$10<span className="text-xl font-normal text-gray-500">/month</span></div>
              <ul className="mt-6 space-y-4" role="list">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Unlimited searches</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Advanced market research tools</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Comprehensive user discovery across all platforms</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push(`/checkout`)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Choose Pro Plan</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Basic Plan</CardTitle>
              <CardDescription>For small-scale research needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">$3.39<span className="text-xl font-normal text-gray-500">/month</span></div>
              <ul className="mt-6 space-y-4" role="list">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>unlimited searches</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Basic market research tools</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>User discovery across major platforms (Reddit, Quora, Hacker News, and more)</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" aria-hidden="true" />
                  <span>Email support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push(`/checkout`)} className="w-full">Choose Basic Plan</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
