// Update src/app/api/verify-subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/app/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
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

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Update user in Firestore
    const userRef = doc(db, 'users', customerEmail);
    await updateDoc(userRef, {
      isSubscribed: true,
      subscriptionId: (session.subscription as Stripe.Subscription)?.id || session.id,
      credits: 100, // Reset to Pro level
      lastCreditReset: new Date(),
      stripeCustomerId: (session.customer as Stripe.Customer)?.id,
      subscriptionStatus: (session.subscription as Stripe.Subscription)?.status || 'active',
      subscriptionPlan: 'Pro',
      updatedAt: new Date(),
    });

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