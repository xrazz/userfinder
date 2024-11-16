'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'

export default function TabDataSkeleton({ itemCount = 5 }: { itemCount?: number }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // return (
  //   <div className="space-y-4 mx-auto p-4" aria-busy="true" aria-live="polite">
  //     <div className="flex items-center justify-center space-x-2 mb-6">
  //       <Loader2 className="h-4 w-4 animate-spin" />
  //       <span className="text-sm text-muted-foreground">Running: {seconds}s</span>
  //     </div>
      
  //     {Array.from({ length: itemCount }).map((_, index) => (
  //       <div key={index}>
  //         <div className="flex items-start space-x-3">
  //           <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
  //           <div className="flex-1">
  //             <div className="flex items-center justify-between">
  //               <div className="w-24 h-4 bg-muted rounded animate-pulse" />
  //               <div className="w-16 h-4 bg-muted rounded animate-pulse" />
  //             </div>
  //             <div className="w-3/4 h-6 mt-1 bg-muted rounded animate-pulse" />
  //             <div className="w-full h-4 mt-1 bg-muted rounded animate-pulse" />
  //             <div className="w-5/6 h-4 mt-1 bg-muted rounded animate-pulse" />
  //             <div className="flex items-center justify-between mt-2">
  //               <div className="flex space-x-2">
  //                 {Array.from({ length: 3 }).map((_, btnIndex) => (
  //                   <div
  //                     key={btnIndex}
  //                     className="w-20 h-8 bg-muted rounded animate-pulse"
  //                   />
  //                 ))}
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //         {index < itemCount - 1 && <Separator className="my-4" />}
  //       </div>
  //     ))}
  //   </div>
  // )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center space-x-2 mb-6">
         <Loader2 className="h-4 w-4 animate-spin" />
         <span className="text-sm text-muted-foreground">Running: {seconds}s</span>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="flex flex-col h-full">
            <CardHeader className="flex-grow">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardHeader>
            <CardFooter className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}