// Create a new file: src/app/subscription/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SubscriptionContent from './SubscriptionContent';
import { cookies } from 'next/headers';
import admin from '../firebaseAdmin';
import { redirect } from 'next/navigation';

// Add this export to make the page dynamic
export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  // Check if user is logged in
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login'); // Redirect to login if no token found
  }

  try {
    // Verify the token
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    redirect('/login'); // Redirect to login if token is invalid
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}