import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Calendar, Clock, Users, Phone, Mail, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'

interface BookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'restaurant' | 'travel';
    userInfo: {
        name: string;
        email: string;
        phone?: string;
    };
}

export function BookingDialog({ isOpen, onClose, type, userInfo }: BookingDialogProps) {
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState<'initial' | 'confirmation' | 'success'>('initial');
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [missingInfo, setMissingInfo] = useState<string[]>([]);

    const handleSubmit = async () => {
        if (!query.trim()) return;

        setIsProcessing(true);
        try {
            const endpoint = type === 'restaurant' ? '/api/restaurant-booking' : '/api/travel-booking';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    userInfo
                }),
            });

            const data = await response.json();

            if (data.success) {
                setBookingDetails(data.booking);
                setCurrentStep('confirmation');
            } else if (data.needsMoreInfo) {
                setMissingInfo(data.missingInfo);
                toast.error("More information needed", {
                    description: `Please provide: ${data.missingInfo.join(', ')}`,
                });
            } else {
                throw new Error(data.error || 'Failed to process booking');
            }
        } catch (error) {
            console.error('Booking error:', error);
            toast.error("Booking failed", {
                description: "Please try again or contact support.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmBooking = () => {
        // Here you would typically make another API call to confirm the booking
        // For now, we'll just simulate success
        setCurrentStep('success');
        toast.success("Booking confirmed!", {
            description: `Your ${type} booking has been confirmed.`,
        });
    };

    const renderContent = () => {
        switch (currentStep) {
            case 'initial':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {type === 'restaurant'
                                ? "Tell me where and when you'd like to dine. For example: 'Book a table for 2 at La Maison tomorrow at 8 PM'"
                                : "Tell me about your travel plans. For example: 'Book a flight from London to Paris next Friday, returning Sunday'"}
                        </p>
                        
                        <div className="flex flex-col gap-2">
                            <Label>Your request</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type your booking request..."
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit();
                                        }
                                    }}
                                />
                                <Button 
                                    onClick={handleSubmit}
                                    disabled={isProcessing || !query.trim()}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {missingInfo.length > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Please provide the following information:
                                </p>
                                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                                    {missingInfo.map((info) => (
                                        <li key={info}>{info}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );

            case 'confirmation':
                return (
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg space-y-3">
                            <h4 className="font-medium">Booking Details</h4>
                            {type === 'restaurant' ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4" />
                                        <span>{bookingDetails.guests} guests</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>{bookingDetails.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span>{bookingDetails.time}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">Type:</span>
                                        <span>{bookingDetails.type}</span>
                                    </div>
                                    {bookingDetails.departure && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">From:</span>
                                            <span>{bookingDetails.departure}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">To:</span>
                                        <span>{bookingDetails.destination}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>{bookingDetails.departureDate}</span>
                                        {bookingDetails.returnDate && (
                                            <span>- {bookingDetails.returnDate}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCurrentStep('initial')}>
                                Edit
                            </Button>
                            <Button onClick={confirmBooking}>
                                Confirm Booking
                            </Button>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Booking Confirmed!</h4>
                            <p className="text-sm">
                                Booking reference: {bookingDetails.bookingId}
                            </p>
                        </div>
                        <Button onClick={onClose} className="mt-4">
                            Done
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {type === 'restaurant' ? 'Restaurant Booking' : 'Travel Booking'}
                    </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="max-h-[60vh] px-1">
                    {renderContent()}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
} 