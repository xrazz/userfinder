'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import ProfessionalComparisonChart from "@/components/ui/compare"

export default function Pricing() {
  const router = useRouter()

  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-6 items-center">
          <div className="flex flex-col justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Acquire App Users, Not Ad Spend
              </h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mx-auto">
                Stop wasting thousands on ineffective ads. With UserFinder AI, you can directly introduce your app to users who are actively seeking solutions like yours.
              </p>
            </div>
          </div>

          <div className="flex justify-center items-center">
             <ProfessionalComparisonChart/>
          </div>

          <div className="flex justify-center items-center w-full">
            <div className="w-full max-w-sm">
              <Button onClick={() => router.push('/pricing')} className="w-full">
                View Pricing
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}