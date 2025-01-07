'use client'

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Loader2, ArrowLeft, LogOut, HelpCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@/app/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebaseClient';
import Cookies from 'js-cookie';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Make sure we're using the correct environment variable name
const stripePublishableKey = 'pk_live_51PtCfLBf9CZHTEFpXX6FtJ5XiXdbebZdKPEE7HQkodedmRBoJthtSg8QJ5v9mLKLBE7fJd30TKAs9UYmnDI04SyO00pxtGsKFV';

if (!stripePublishableKey) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe only if we have a publishable key
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function SubscriptionContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Subscribe to user document for subscription updates
        const userDocRef = doc(db, 'users', user.email!);
        const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setSubscriptionPlan(data.subscriptionPlan || 'Free');
            setSubscriptionStatus(data.subscriptionStatus || null);
          }
          setLoading(false);
        });
        return () => unsubscribeDoc();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubscribe = async () => {
    console.log('Subscribe button clicked');
    
    if (!stripePromise) {
      toast.error('Stripe configuration error. Please try again later.');
      console.error('Stripe not initialized:', { stripePublishableKey });
      return;
    }

    if (!user) {
      toast.error('Please sign in to subscribe');
      router.push('/login');
      return;
    }

    try {
      console.log('Creating subscription for user:', user.email);
      
      const token = await user.getIdToken();
      
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error('Failed to create subscription');
      }

      const { sessionId } = await response.json();
      console.log('Received sessionId:', sessionId);
      
      const stripe = await stripePromise;
      console.log('Stripe loaded:', !!stripe);
      
      if (!stripe) throw new Error('Stripe failed to load');

      console.log('Redirecting to checkout...');
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        setStripeError(error.message || 'Failed to process subscription');
        toast.error('Failed to process subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <nav className="flex items-center space-x-6">
              <span className="font-medium">Subscription</span>
            </nav>
            <div className="flex items-center space-x-4">
              {user && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10">
                        <AvatarImage src={user.photoURL || "/placeholder.svg?height=32&width=32"} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px]" align="end" forceMount>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={user.photoURL || "/placeholder.svg?height=48&width=48"} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 pt-5 border-t space-y-3">
                      <a
                        href="mailto:info@lexy.uno"
                        className="flex items-center w-full px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        info@lexy.uno
                      </a>
                      <Button 
                        variant="ghost" 
                        className="w-full px-3 py-2 h-auto font-normal text-sm justify-start hover:bg-muted" 
                        onClick={() => {
                          auth.signOut();
                          router.push('/login');
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {subscriptionPlan === 'Pro' ? 'Pro Plan Active' : 'Upgrade to Pro'}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {subscriptionPlan === 'Pro' 
                ? 'You have access to all premium features'
                : 'Unlock powerful AI features and get more daily credits'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Free Plan */}
            <Card className={`relative overflow-hidden ${subscriptionPlan === 'Free' ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
              <CardHeader className="pb-4 md:pb-6">
                <CardTitle className="flex flex-col gap-1 md:gap-2">
                  <span>Free Plan</span>
                  <span className="text-2xl md:text-3xl font-bold">$0</span>
                </CardTitle>
                <CardDescription>Get started with basic features</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 md:pb-6">
                <ul className="space-y-2 md:space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm md:text-base">5 AI credits per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm md:text-base">Basic web search</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm md:text-base">Standard support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled
                >
                  {subscriptionPlan === 'Free' ? 'Current Plan' : 'Basic Plan'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className={`relative overflow-hidden border-purple-200 dark:border-purple-800 shadow-lg ${subscriptionPlan === 'Pro' ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600" />
              <CardHeader className="pb-4 md:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex flex-col gap-1 md:gap-2">
                    <span>Pro Plan</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-bold">$9.99</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                  </CardTitle>
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                    Popular
                  </div>
                </div>
                <CardDescription>Perfect for power users who need more AI capabilities</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 md:pb-6">
                <ul className="space-y-2 md:space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base font-medium">50 AI credits per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Advanced web search with AI analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Vision search with image analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Social media search and insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Credits reset daily</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 md:gap-4">
                {subscriptionPlan === 'Pro' ? (
                  <Button 
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubscribe}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700"
                    size="lg"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  {subscriptionPlan === 'Pro' 
                    ? `Subscription ${subscriptionStatus?.toLowerCase() || 'active'}`
                    : 'Cancel anytime. No questions asked.'}
                </p>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left max-w-2xl mx-auto">
              <div className="space-y-2">
                <h3 className="font-medium">What are AI credits?</h3>
                <p className="text-sm text-muted-foreground">
                  AI credits are used for advanced features like vision search, social insights, and AI analysis. They reset daily at midnight.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 