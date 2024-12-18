'use client'

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@/app/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import Cookies from 'js-cookie';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubscribe = async (plan: 'pro' | 'enterprise' = 'pro') => {
    console.log('Subscribe button clicked for plan:', plan);
    console.log('User:', user);

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
    <div className="container mx-auto py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground">Select the perfect plan for your needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex flex-col gap-2">
                <span>Free Plan</span>
                <span className="text-3xl font-bold">$0/mo</span>
              </CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>10 AI credits per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Basic AI summaries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Standard support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Credits reset daily</span>
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
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-purple-200 dark:border-purple-800 shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-xs font-medium px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2">
                <span>Pro Plan</span>
                <span className="text-3xl font-bold">$9.99/mo</span>
              </CardTitle>
              <CardDescription>Perfect for power users</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>100 AI credits per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Advanced AI summaries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Credits reset daily</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSubscribe('pro')}
                className="w-full"
                size="lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex flex-col gap-2">
                <span>Enterprise Plan</span>
                <span className="text-3xl font-bold">$49.99/mo</span>
              </CardTitle>
              <CardDescription>For unlimited usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Unlimited AI credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Premium AI features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>24/7 Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Custom integrations</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSubscribe('enterprise')}
                className="w-full"
                size="lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include basic features. Upgrade or downgrade at any time.</p>
        </div>
      </div>
    </div>
  );
} 