import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
  try {
    const paypalClientID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET_KEY;

    const createOrderUrl = 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

    // Define the data payload for creating the order
    const data = {
      intent: 'CAPTURE',  // Capture the payment immediately
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: '10.00', // Dynamic price based on selected plan
          },
        },
      ],
      application_context: {
        return_url: 'https://your-return-url.com', // URL after user approval
        cancel_url: 'https://your-cancel-url.com',  // URL if user cancels the payment
        no_shipping: 1,  // Prevent PayPal from requesting shipping information
        user_action: 'PAY_NOW', // Directly ask the user to pay without review page
        shipping_preference: 'NO_SHIPPING', // Ensure no shipping info is asked
      },
    };

    // Send the request to create the PayPal order
    const response = await axios.post(createOrderUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${paypalClientID}:${paypalSecret}`).toString('base64')}`,
      },
    });

    // Extract the order ID and approval link
    const orderID = response.data.id;
    const approvalLink = response.data.links.find((link: { rel: string }) => link.rel === 'approve').href;

    // Return the orderID and approval link to the frontend
    return NextResponse.json({ orderID, approvalLink });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
  }
}
