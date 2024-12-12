'use client';

import React, { useState, useEffect } from 'react';

interface PayPalButtonProps {
  plan: "basic" | "pro";
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ plan }) => {
  const [orderID, setOrderID] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to create an order
  const createOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      if (data.orderID) {
        setOrderID(data.orderID);
        console.log(data.orderID)
      }
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle successful payment capture
  const handlePayment = async () => {
    if (!orderID) return;

    try {
      const response = await fetch("/api/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID }),
      });

      const data = await response.json();
      if (data.message === "Payment successful") {
        alert("Payment Successful!");
        // Handle success actions (e.g., update Firebase)
      }
    } catch (error) {
      console.error("Error capturing order:", error);
    }
  };

  return (
    <div>
      <button onClick={createOrder} disabled={loading}>
        {loading ? "Processing..." : `Pay ${plan === "basic" ? "$10" : "$29"}`}
      </button>

      {orderID && (
        <button onClick={handlePayment}>Confirm Payment</button>
      )}
    </div>
  );
};

export default PayPalButton;
