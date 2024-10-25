import React from "react"
import Image from "next/image"
import { ArrowRight, CreditCard, Mail, User, Calendar, Lock } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CardProps = React.ComponentProps<typeof Card>

function CompactCheckoutForm({ className, ...props }: CardProps) {
  return (
    <Card className={cn("w-full max-w-md mx-auto", className)} {...props}>
      <CardHeader className="text-center p-4">
        <CardTitle className="text-2xl font-bold">Checkout</CardTitle>
        <CardDescription>Complete your purchase</CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <div className="relative">
            <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="name" placeholder="John Doe" className="pl-8 h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="john@example.com" className="pl-8 h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="card" className="text-sm font-medium">Card Number</Label>
          <div className="relative">
            <CreditCard className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="card" placeholder="1234 5678 9012 3456" className="pl-8 h-9 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry" className="text-sm font-medium">Expiry</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="expiry" placeholder="MM/YY" className="pl-8 h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-sm font-medium">CVV</Label>
            <div className="relative">
              <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="cvv" placeholder="123" className="pl-8 h-9 text-sm" />
            </div>
          </div>
        </div>
        <div className="bg-primary/5 p-3 rounded-md">
          <h3 className="text-sm font-semibold mb-1">Order Summary</h3>
          <p className="text-xs text-muted-foreground">UserFinder AI - 1 month subscription</p>
          <p className="text-sm font-bold mt-1">Total: $10.00</p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4">
        <Button className="w-full">
          Complete Purchase <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

const CompactNavbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="UserFinder AI Logo" width={16} height={16} />
          <span className="font-bold text-sm">Pay $10</span>
        </div>
      </div>
    </nav>
  )
}

const CompactCheckoutPage = () => {
  return (
    <main className="flex flex-col items-start justify-start min-h-screen p-4 pt-14">
      <CompactNavbar />
      <CompactCheckoutForm />
    </main>
  )
}

export default CompactCheckoutPage