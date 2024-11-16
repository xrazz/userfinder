import React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

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

function PrivacyPolicyPage({ className, ...props }: CardProps) {
  return (
    <Card className={cn("w-full max-w-4xl mx-auto shadow-none", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
        <CardDescription>Effective Date: October 3, 2024</CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            At UserFinder.online, we respect your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and protect your data when you use our website and services.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground">
            When you sign up for UserFinder.online using Google login, we collect the following information:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Google Account Information: This includes your name, email address, and any other information Google provides when you authorize us to access your account.</li>
            <li>Usage Data: We collect information about how you use the Service, including search queries, interactions, and time spent on the platform.</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Provide, maintain, and improve our Service.</li>
            <li>Personalize your experience and provide relevant content.</li>
            <li>Communicate with you regarding updates, new features, and billing information.</li>
            <li>Analyze usage trends to improve the performance and functionality of the platform.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We will not sell or share your personal information with third parties except as necessary to provide our services (such as processing payments), or if required by law.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3. Third-Party Services</h2>
          <p className="text-sm text-muted-foreground">
            We use third-party services, including:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Google Login: To authenticate and create user accounts.</li>
            <li>Payment Processors: To handle billing and subscription payments. We do not store your payment information on our servers; it is securely handled by our payment gateway partners.</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">4. Data Security</h2>
          <p className="text-sm text-muted-foreground">
            We take data security seriously and use industry-standard encryption and secure communication protocols to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">5. Cookies and Tracking Technologies</h2>
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience on UserFinder.online. These cookies help us track your usage and preferences. You can control or disable cookies through your browser settings, though some features of the Service may not function properly without them.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p className="text-sm text-muted-foreground">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Access, update, or delete your personal information.</li>
            <li>Withdraw consent for data collection at any time.</li>
            <li>Request that we provide a copy of the data we have collected from you.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            To exercise these rights, please contact us at help.userfinder@gmail.com.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page, and significant changes will be communicated via email or website notifications.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">8. Contact Information</h2>
          <p className="text-sm text-muted-foreground">
            If you have any questions about this Privacy Policy or how we handle your data, please contact us at help.userfinder@gmail.com.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Link href="/login" className="w-full md:w-auto">
          <Button className="w-full md:w-auto">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
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
          <span className="font-bold text-lg">Privacy Policy</span>
        </div>
         
      </div>
    </nav>
  )
}

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-8 pt-20">
        <PrivacyPolicyPage />
      </main>
    </div>
  )
}

export default Page