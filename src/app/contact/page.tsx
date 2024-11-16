'use client'

import React, { useState } from "react";
import Image from "next/image";
import { Mail, MessageCircle, CreditCard, HelpCircle, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
   
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from '@/app/firebaseClient'; // Import your existing Firestore instance
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore methods

const contactInfo = [
  {
    icon: <Mail className="h-5 w-5" />,
    title: "General Inquiries",
    email: "help.userfinder@gmail.com",
    description: "For general questions or feedback.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Payment Issues",
    email: "help.userfinder@gmail.com",
    description: "For payment-related support.",
  },
  {
    icon: <HelpCircle className="h-5 w-5" />,
    title: "Technical Support",
    email: "help.userfinder@gmail.com",
    description: "If you need technical assistance.",
  },
];

type CardProps = React.ComponentProps<typeof Card>;

function ContactPage({ className, ...props }: CardProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // State to manage loading status

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Start loading

    try {
      // Create a document reference in the contact collection with the email as document ID
      const contactDocRef = doc(db, 'contact', email);
      
      // Set the message data
      await setDoc(contactDocRef, {
        name,
        message,
        timestamp: new Date(), // Optional: add a timestamp
      });

      // Clear the form inputs
      setName('');
      setEmail('');
      setMessage('');

      // Show success alert after 2 seconds
      setTimeout(() => {
        alert('Your message has been sent successfully! you will be contacted within 24 hours');
      }, 10);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again later.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <Card className={cn("w-full max-w-4xl mx-auto shadow-none", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Contact UserFinder AI</CardTitle>
        <CardDescription>We&apos;re here to help! Reach out to us through any of these channels.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          {contactInfo.map((info, index) => (
            <Card key={index} className="bg-primary/5 shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {info.icon}
                  {info.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{info.email}</p>
                <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Send Us a Message</h2>
          <form onSubmit={handleSendMessage} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow-none"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="shadow-none"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <Textarea
                id="message"
                placeholder="Your message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="shadow-none"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto justify-self-start">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0 8 8 0 01-16 0z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">When to Contact Us</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Suggestions and Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Feel free to reach out to us anytime for product suggestions or feedback.</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment-Related Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">We address payment-related issues within 24 hours of receiving your email.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const Navbar = () => {
  return (
    <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
          <span className="font-bold text-lg">Contact</span>
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
      <ContactPage />
    </main>
  );
}

export default Page;
