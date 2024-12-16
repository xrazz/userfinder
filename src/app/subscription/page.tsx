// Create a new file: src/app/subscription/page.tsx
'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionPage({ userId, email }: { userId: string, email: string }) {
  const router = useRouter();

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create subscription');

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        toast.error('Failed to process subscription');
        console.error('Stripe error:', error);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription');
    }
  };

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
          <p>Free plan: 3 credits per day</p>
          <p>Pro plan: 100 credits per day</p>
        </div>
      </div>
    </div>
  );
}