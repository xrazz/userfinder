import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const paypalClientID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET_KEY;

    // Get the order ID from the request body
    const { orderID } = await request.json();

    if (!orderID) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // PayPal API endpoint to capture the order
    const captureOrderUrl = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`;

    // Send a POST request to capture the payment
    const response = await axios.post(captureOrderUrl, {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${paypalClientID}:${paypalSecret}`).toString('base64')}`,
      },
    });

    // Check if the capture was successful
    if (response.data.status === 'COMPLETED') {
      return NextResponse.json({ success: true, message: 'Payment captured successfully' });
    } else {
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json({ error: 'An error occurred while capturing the payment' }, { status: 500 });
  }
}
