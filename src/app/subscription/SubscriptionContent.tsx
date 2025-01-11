'use client'

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Loader2, ArrowLeft, LogOut, HelpCircle, AlertCircle, Shield, Star } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Make sure we're using the correct environment variable name
const stripePublishableKey = 'pk_live_51PtCfLBf9CZHTEFpXX6FtJ5XiXdbebZdKPEE7HQkodedmRBoJthtSg8QJ5v9mLKLBE7fJd30TKAs9UYmnDI04SyO00pxtGsKFV';
// const stripePublishableKey = 'pk_test_51PtCfLBf9CZHTEFp4ALwMBz12cI7r2ZsXWuaDOVwjjdNwrHxAlwDRz8i70tT0dT8HDXyU9GdpS6iusjFRq9UNS3w00euRBUv1M';

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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

  const handleSubscribe = async (plan: 'pro' | 'unlimited' | 'credits' = 'pro') => {
    console.log('Subscribe button clicked for plan:', plan);
    
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
          plan: plan
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

  const handleCancelSubscription = async () => {
    if (!user) {
      toast.error('Please sign in to manage your subscription');
      router.push('/login');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error('Failed to cancel subscription');
      }

      toast.success('Your subscription has been cancelled');
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('Failed to cancel subscription');
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
            <div className="flex justify-center mb-2">
              <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-sm px-3 py-1 rounded-full">
                Limited Time Offer
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {subscriptionPlan === 'Pro' ? 'Welcome to Pro!' : 'Unlock Your Full Potential'}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {subscriptionPlan === 'Pro' 
                ? "You're now part of our elite community of power users"
                : "Join thousands of power users"}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1" />
                <span>4.9/5 Rating</span>
              </div>
              <span>•</span>
              <div>97% Satisfaction</div>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            {/* One-time Credits Card - Now First */}
            <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600" />
              <CardHeader className="pb-4 md:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex flex-col gap-1 md:gap-2">
                    <span>Support the Launch</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-bold">$1</span>
                      <span className="text-muted-foreground">one-time</span>
                    </div>
                  </CardTitle>
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    Early Access
                  </div>
                </div>
                <CardDescription>Get 20 credits while supporting our launch</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 md:pb-6">
                <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium text-center">
                    Be among our first supporters!
                  </p>
                </div>
                <ul className="space-y-2 md:space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">20 AI credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">One-time payment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">All AI capabilities</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubscribe('credits');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700"
                  size="lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Support with $1
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan Card - Now Second */}
            <Card className={`relative overflow-hidden border-purple-200 dark:border-purple-800 shadow-lg ${subscriptionPlan === 'Pro' ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600" />
              <CardHeader className="pb-4 md:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex flex-col gap-1 md:gap-2">
                    <span>Pro Plan</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-bold">$19.99</span>
                      <span className="text-muted-foreground">/mo</span>
                      <span className="text-sm line-through text-muted-foreground ml-2">$29.99/mo</span>
                    </div>
                  </CardTitle>
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                    Unlimited
                  </div>
                </div>
                <CardDescription>Access unlimited AI capabilities</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 md:pb-6">
                <div className="mb-4 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium text-center">
                    Users save 5+ hours/week with Pro features
                  </p>
                </div>
                <ul className="space-y-2 md:space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base font-medium">Unlimited AI credits</span>
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
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 md:gap-4">
                {subscriptionPlan === 'Pro' ? (
                  <>
                    <Button 
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled
                    >
                      Current Plan
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel Subscription
                    </Button>

                    <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            Cancel Subscription
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel your subscription? You'll lose access to unlimited credits and premium features at the end of your current billing period.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleCancelSubscription}
                          >
                            Yes, Cancel Subscription
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    <div className="w-full text-center mb-2">
                      <div className="text-sm line-through text-muted-foreground">Regular price: $29.99/mo</div>
                      <div className="text-sm text-green-600 font-medium">You save: $10/mo</div>
                    </div>
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubscribe('pro');
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700"
                      size="lg"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Get Unlimited
                    </Button>
                 
                  </>
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
                  With the Pro plan, you get unlimited AI credits for all features including vision search, social insights, and AI analysis.
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