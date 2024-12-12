import { db } from '@/app/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body from the request
    const body = await req.json();

    // Extract the type and data from the webhook payload
    const { type, data } = body;

    if (type === 'donation.created') {
      const {
        amount,
        supporter_name,
        supporter_email,
        message,
        support_note,
        total_amount_charged,
      } = data;

      upgradeToPremium("irajtripathi0@gmail.com")
      // Log or process the donation data
      console.log('New donation received:', {
        amount,
        supporter_name,
        supporter_email,
        message,
        support_note,
        total_amount_charged,
      });

      // Optional: Add additional processing, such as saving to a database or triggering other services
    }

    // Send a response indicating successful receipt of the webhook
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}


async function upgradeToPremium(profileEmail:string) {
    try {
      const userRef = db.collection('users').doc(profileEmail);
      await userRef.update({
        isPremium: true
      });
      console.log("User's premium status updated successfully.");
    } catch (error) {
      console.error("Error updating premium status:", error);
    }
  }
  