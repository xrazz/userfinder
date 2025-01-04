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

if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing STRIPE_PUBLISHABLE_KEY environment variable');
}

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

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

  const handleSubscribe = async () => {
    console.log('Subscribe button clicked');
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
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Upgrade Your Experience</h1>
          <p className="text-muted-foreground">Get more AI-powered insights with our Pro plan</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pro Plan</span>
              <span className="text-2xl font-bold">$9.99/mo</span>
            </CardTitle>
            <CardDescription>Perfect for power users who need more AI capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>50 AI credits per day</span>
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
              onClick={handleSubscribe}
              className="w-full"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Pro plan: 50 credits per day</p>
        </div>
      </div>
    </div>
  );
} 