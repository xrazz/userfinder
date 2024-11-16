import React from "react"
import Image from "next/image"
import { Shield, Clock, Mail, AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CardProps = React.ComponentProps<typeof Card>

function RefundPolicyPage({ className, ...props }: CardProps) {
  return (
    <Card className={cn("w-full max-w-4xl shadow-none mx-auto", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Refund Policy</CardTitle>
        <CardDescription>
          At UserFinder.online, we&#39;re committed to your satisfaction and transparency in our services.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Our Commitment
          </h2>
          <p className="text-sm text-muted-foreground">
            We strive to provide a valuable and reliable service. However, we understand that sometimes things may not work out as expected. Our refund policy is designed to ensure your satisfaction and confidence in using UserFinder.online.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-primary/5 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                7-Day Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                We offer a 7-day satisfaction guarantee. If you feel that our tool is not meeting your expectations within the first 7 days of your purchase, you can request a full refund, no questions asked.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Requesting a Refund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                To request a refund, please contact our support team at help.userfinder@gmail.com with your purchase details. Refund requests must be submitted within 7 days of your initial purchase to be eligible.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            Important Policy 
          </h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">
                <strong>No Refunds After 7 Days:</strong> After the 7-day satisfaction guarantee period, we do not offer refunds. Our product is a digital service with no tangible goods, so we cannot issue refunds for subscriptions that have already been fully utilized.
              </p>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">
                <strong>Cancellation:</strong> You can cancel your subscription at any time, and you will continue to have access to the service until the end of your billing period. There will be no further charges after cancellation, but refunds will not be issued for any unused portion of your subscription.
              </p>
            </li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-center space-y-4">
        <p className="text-sm text-center text-muted-foreground">
          If you have any questions or concerns regarding our refund policy, please don&#39;t hesitate to reach out to us.
        </p>
        <a href="./contact"> <Button className="w-full md:w-auto">
          <Mail className="mr-2 h-4 w-4" />
          Contact Support
        </Button> </a>
       
      </CardFooter>
    </Card>
  )
}

const Navbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={40} height={40} />
          <span className="font-bold text-lg">Refund Policy</span>
        </div>
        {/* <span className="text-lg font-semibold">Refund Policy</span> */}
      </div>
    </nav>
  )
}

const Page = () => {
  return (
    <main className="flex-grow flex flex-col items-center justify-center p-8 pt-20">
      <Navbar />
      <RefundPolicyPage />
    </main>
  )
}

export default Page