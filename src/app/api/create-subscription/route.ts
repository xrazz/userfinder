// Update src/app/api/create-subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLAN_PRICE = {
  amount: 1999,
  name: 'Pro Subscription',
  description: 'Unlimited AI credits'
};

const CREDITS_PRICE = {
  amount: 100, // $1.00
  name: '20 AI Credits',
  description: 'One-time purchase of 20 AI credits'
};

export async function POST(req: Request) {
  try {
    const { email, userId, plan = 'pro' } = await req.json();

    // First, create or retrieve a customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      });
    }

    // Create the checkout session based on plan type
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan === 'credits' ? CREDITS_PRICE.name : PLAN_PRICE.name,
              description: plan === 'credits' ? CREDITS_PRICE.description : PLAN_PRICE.description,
            },
            unit_amount: plan === 'credits' ? CREDITS_PRICE.amount : PLAN_PRICE.amount,
            ...(plan !== 'credits' && {
              recurring: {
                interval: 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: plan === 'credits' ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription`,
      metadata: {
        userId: userId,
        userEmail: email,
        plan: plan
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription session' },
      { status: 500 }
    );
  }
}