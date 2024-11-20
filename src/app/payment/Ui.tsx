'use client'

import React, { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { updateMembershipLevel } from '../firebaseClient';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface CheckoutPageProps {
  amount: number;
  mail:string;
  features: string[];
}

export default function CheckoutPage({ amount,mail ,features }: CheckoutPageProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const featureList = Array.isArray(features) ? features : [];
console.log(mail)
  useEffect(() => {
    const loadPayPalScript = async () => {
      if (window.paypal && paypalRef.current) {
        try {
          await window.paypal.Buttons({
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: { value: amount.toString() },
                  shipping_preference: "NO_SHIPPING",
                }],
                application_context: {
                  return_url: `${window.location.origin}/success`,
                  cancel_url: `${window.location.origin}/dashboard`,
                }
              });
            },
            onApprove: async (data: any, actions: any) => {
              try {
                const order = await actions.order.capture();
                console.log('Order approved:', order);
            
                // Extracting the amount paid from the order details
                const amountPaid = parseFloat(order.purchase_units[0].amount.value);
            
                // Determine membership level based on the amount paid
                let membershipLevel = '';
                if (amountPaid === 29) {
                  membershipLevel = 'Pro';
                } else if (amountPaid === 10) {
                  membershipLevel = 'Basic';
                }
            
                // Update membership level in Firestore
                if (membershipLevel) {
                  await updateMembershipLevel(mail, membershipLevel);
                  console.log(`Membership level updated to ${membershipLevel}`);
                } else {
                  console.error('Invalid payment amount, membership level not updated.');
                }
            
                // Redirect to success page
                window.location.href = '/success';
              } catch (error) {
                console.error('Error processing order or updating membership level:', error);
              }

            },
            onError: (err: any) => {
              console.error('PayPal error:', err);
              alert('Payment could not be completed. Please try again.');
            }
          }).render(paypalRef.current);
        } catch (error) {
          console.error('Failed to render PayPal Buttons:', error);
        }
      }
    };

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = loadPayPalScript;
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
    };
    document.body.appendChild(script);

    // return () => {
    //   document.body.removeChild(script);
    // };
  }, [amount]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">Complete Your Purchase</h1>
      <ul className="space-y-2 w-full">
        {featureList.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-green-500" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Separator className="w-full" />
      <p className="text-xl font-semibold">Total: ${amount.toFixed(2)}</p>
      <div ref={paypalRef} className="w-full max-w-[300px]" />
    </div>
  );
}