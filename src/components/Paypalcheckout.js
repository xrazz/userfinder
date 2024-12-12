import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PayPalCheckout = () => {
  const [amount, setAmount] = useState(10); // Default to $10 option

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD`;
    script.addEventListener('load', () => {
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [{
                amount: { value: amount.toString() }, // Use selected amount
                shipping_preference: "NO_SHIPPING", // No billing/shipping info
              }],
            });
          },
          onApprove: async (data, actions) => {
            const order = await actions.order.capture();
            console.log('Order approved:', order);

            // Update Firestore database upon successful payment
            const userRef = doc(db, "users", "testUser"); // Replace with dynamic user ID
            await updateDoc(userRef, { hasPaid: true, paymentAmount: amount });

            alert('Payment successful!');
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            alert('Payment could not be completed.');
          }
        }).render('#paypal-button-container');
      }
    });
    document.body.appendChild(script);
  }, [amount]);

  return (
    <div>
      <h3>Select a Payment Option</h3>
      <select onChange={(e) => setAmount(e.target.value)} value={amount}>
        <option value={10}>$10</option>
        <option value={29}>$29</option>
      </select>
      <div id="paypal-button-container"></div>
    </div>
  );
};

export default PayPalCheckout;
