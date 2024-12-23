// Update src/app/api/update-credits/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseClient';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import Stripe from 'stripe';

// Initialize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
      const body = await req.json();
      console.log('Received request body:', body);
      const { sessionId } = body;
  
      if (!sessionId) {
        console.log('Missing sessionId in request');
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        );
      }
  
      // Retrieve the checkout session with expanded customer data
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'subscription'],
      });
  
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
  
      // Get customer email from metadata or customer object
      const customerEmail = session.metadata?.userEmail || 
                           (session.customer as Stripe.Customer)?.email;
  
      console.log('Session:', {
        metadata: session.metadata,
        customerEmail,
        customer: session.customer,
      });
  
      if (!customerEmail) {
        return NextResponse.json(
          { error: 'Customer email not found' },
          { status: 400 }
        );
      }
  
      // Create or update user in Firestore
      const userRef = doc(db, 'users', customerEmail);
      const userDoc = await getDoc(userRef);
  
      const userData = {
        isSubscribed: true,
        subscriptionId: (session.subscription as Stripe.Subscription)?.id || session.id,
        credits: 100, // Reset to Pro level
        lastCreditReset: new Date(),
        stripeCustomerId: (session.customer as Stripe.Customer)?.id,
        subscriptionStatus: (session.subscription as Stripe.Subscription)?.status || 'active',
        subscriptionPlan: 'Pro',
        updatedAt: new Date(),
        email: customerEmail, // Add email to the document
      };
  
      if (!userDoc.exists()) {
        // If user doesn't exist, create new document
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date(),
        });
      } else {
        // Update existing document
        await updateDoc(userRef, userData);
      }
  
      return NextResponse.json({
        success: true,
        email: customerEmail,
        subscriptionId: (session.subscription as Stripe.Subscription)?.id || session.id,
        status: (session.subscription as Stripe.Subscription)?.status || 'active',
      });
  
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return NextResponse.json(
        { error: 'Failed to verify subscription' },
        { status: 500 }
      );
    }
  }