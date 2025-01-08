import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    isLoading: boolean;
}

export function LoadingSpinner({ isLoading }: LoadingSpinnerProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin">
                <Loader2 className="h-12 w-12 text-purple-600" />
            </div>
        </div>
    );
} 