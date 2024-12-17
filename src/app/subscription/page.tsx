// Create a new file: src/app/subscription/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SubscriptionContent from './SubscriptionContent';

// Add this export to make the page dynamic
export const dynamic = 'force-dynamic';

export default function SubscriptionPage() {
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