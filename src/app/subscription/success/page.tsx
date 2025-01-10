// Update src/app/subscription/success/page.tsx
'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams?.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        setErrorMessage('Invalid session ID');
        return;
      }

      try {
        const response = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to verify subscription');
        }

        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
        } else {
          throw new Error('Subscription verification failed');
        }
      } catch (error) {
        console.error('Error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to verify subscription');
      }
    };

    verifySubscription();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="container max-w-lg mx-auto py-20">
        <Card>
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Confirming your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container max-w-lg mx-auto py-20">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Subscription Error</CardTitle>
            </div>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/subscription')}>
              Try Again
            </Button>
            <Button variant="default" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-20">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle>Welcome to Pro!</CardTitle>
              <CardDescription>Your subscription has been activated successfully</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">What's included:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Unlimited AI credits</li>
              <li>Advanced AI analysis</li>
              <li>Vision search capabilities</li>
              <li>Social media insights</li>
              <li>Priority support</li>
            </ul>
          </div>
          <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <AlertDescription className="text-purple-950 dark:text-purple-200">
              You now have unlimited access to all Pro features. Start exploring the full power of AI!
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700" 
            onClick={() => router.push('/')}
          >
            Start Using Pro Features
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-lg mx-auto py-20">
        <Card>
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}