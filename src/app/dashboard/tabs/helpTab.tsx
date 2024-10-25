'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Ensure you have a TextArea component

import { auth } from '@/app/firebaseClient';
import { db } from '@/app/firebaseClient'; // Import your existing Firestore instance
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore methods
import React from 'react';

const Help = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [uid, setUid] = useState<string | null>(null); // State to hold UID
  const [loading, setLoading] = useState(false); // State to manage loading status

  

  useEffect(() => {
    // Get the current user
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUid(currentUser.uid); // Set the UID if the user is logged in
      setEmail(currentUser.email || ''); // Optionally set the email
    }
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!uid) {
      alert('User not authenticated.'); // Show alert if user is not authenticated
      return;
    }

    setLoading(true); // Set loading to true
    try {
      // Create a document reference in the feedbacks collection with the user's UID
      const feedbackDocRef = doc(db, 'feedbacks', uid); // Use the existing db instance

      // Set the feedback data
      await setDoc(feedbackDocRef, {
        email,
        message,
        timestamp: new Date(), // Optional: add a timestamp
      });

      setEmail(''); // Clear email input
      setMessage(''); // Clear message input

      // Show success alert after 2 seconds
      setTimeout(() => {
        alert('Feedback submitted successfully!');
      }, 10);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again later.'); // Show error alert
    } finally {
      setLoading(false); // Set loading to false after request
    }
  };

  return (
    <main className="flex-grow flex items-start justify-center p-4">
      <div className="w-full max-w-4xl"> {/* Set max width to match "How To" page */}
        {/* Feedback Form */}
        <h1 className="text-2xl font-semibold mb-4">Help & Support</h1>
        <p className="text-sm font-medium mb-4">We are here to help! Please provide your feedback or ask a question.</p>
        <form onSubmit={handleFeedbackSubmit} className="flex flex-col space-y-4">
          <Input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm font-medium border border-gray-300 focus:border-gray-800" // Dark border even when not active
            required
          />
          <Textarea
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full text-sm font-medium border border-gray-300 focus:border-gray-800" // Dark border even when not active
            rows={16} // Increased rows for a larger text area
            required
          />
          <Button type="submit" className={`bg-black text-white hover:bg-gray-800 transition duration-300 text-base flex items-center justify-center`}>
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0 8 8 0 01-16 0z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default Help;
