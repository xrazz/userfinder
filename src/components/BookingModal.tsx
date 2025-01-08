import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Star, StarHalf, Phone, MapPin, Euro, Clock, Info, Plane, Hotel as HotelIcon, Scissors } from 'lucide-react'
import { mockRestaurants, Restaurant } from '@/data/mockRestaurants'
import { mockHotels, mockFlights, mockSalons, Hotel as HotelType, Flight, Salon } from '@/data/mockServices'
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery: string;
    followUpQuestions: string[];
    bookingType: 'restaurant' | 'hotel' | 'flight' | 'salon';
    currentDetails: any;
}

const ServiceCard = ({ 
    service, 
    type,
    selected, 
    onSelect 
}: { 
    service: Restaurant | HotelType | Flight | Salon;
    type: 'restaurant' | 'hotel' | 'flight' | 'salon';
    selected: boolean; 
    onSelect: () => void;
}) => {
    const renderContent = () => {
        switch (type) {
            case 'restaurant':
                const restaurant = service as Restaurant;
                return (
                    <>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{restaurant.name}</h3>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm">{restaurant.rating}</span>
                                <span className="text-xs text-muted-foreground">({restaurant.reviews})</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{restaurant.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span>{restaurant.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Euro className="w-4 h-4" />
                                <span>{restaurant.priceRange}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{restaurant.openingHours}</span>
                            </div>
                        </div>
                    </>
                );

            case 'hotel':
                const hotel = service as HotelType;
                return (
                    <>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{hotel.name}</h3>
                            <div className="flex items-center gap-1">
                                <span className="text-yellow-500">{'★'.repeat(hotel.stars)}</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{hotel.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Euro className="w-4 h-4" />
                                <span>{hotel.priceRange}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Check-in: {hotel.checkIn} - Check-out: {hotel.checkOut}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {hotel.amenities.map((amenity, index) => (
                                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'flight':
                const flight = service as Flight;
                return (
                    <>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{flight.airline} - {flight.flightNumber}</h3>
                            <span className="text-sm font-medium">{flight.price}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{flight.departure.time}</div>
                                    <div className="text-muted-foreground">{flight.departure.city} ({flight.departure.code})</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-muted-foreground">{flight.duration}</div>
                                    <div className="border-t my-1"></div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">{flight.arrival.time}</div>
                                    <div className="text-muted-foreground">{flight.arrival.city} ({flight.arrival.code})</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {flight.class.map((cls, index) => (
                                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                        {cls}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'salon':
                const salon = service as Salon;
                return (
                    <>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{salon.name}</h3>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm">{salon.rating}</span>
                                <span className="text-xs text-muted-foreground">({salon.reviews})</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{salon.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{salon.openingHours}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {salon.services.map((service, index) => (
                                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                        {service}
                                    </span>
                                ))}
                            </div>
                            <div className="text-muted-foreground">
                                <span className="font-medium">Stylists: </span>
                                {salon.stylists.join(', ')}
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
            }`}
            onClick={onSelect}
        >
            {renderContent()}
        </div>
    );
};

export function BookingModal({ 
    isOpen, 
    onClose, 
    initialQuery,
    followUpQuestions,
    bookingType,
    currentDetails
}: BookingModalProps) {
    const [step, setStep] = useState<'service-selection' | number>('service-selection');
    const [selectedService, setSelectedService] = useState<Restaurant | HotelType | Flight | Salon | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    // Get available services based on type and details
    const getAvailableServices = () => {
        switch (bookingType) {
            case 'restaurant':
                return currentDetails.cuisine
                    ? mockRestaurants.filter(r => 
                        r.cuisine.toLowerCase() === currentDetails.cuisine.toLowerCase())
                    : mockRestaurants;
            case 'hotel':
                return mockHotels;
            case 'flight':
                return mockFlights;
            case 'salon':
                return mockSalons;
            default:
                return [];
        }
    };

    const services = getAvailableServices();

    const handleAnswer = (question: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [question]: answer
        }));
    };

    const handleNext = () => {
        if (step === 'service-selection') {
            if (!selectedService) return;
            setStep(0);
        } else if (typeof step === 'number') {
            if (step < followUpQuestions.length - 1) {
                setStep(step + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        
        // Combine initial details with answers and selected service
        const bookingData = {
            type: bookingType,
            initialQuery,
            service: selectedService,
            details: {
                ...currentDetails,
                ...answers
            },
            timestamp: new Date().toISOString()
        };

        // Log the complete booking data
        console.log('Complete Booking Data:', bookingData);

        // Here you would typically send this to your booking API
        // For now, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsProcessing(false);
        onClose();
    };

    const getServiceIcon = () => {
        switch (bookingType) {
            case 'restaurant':
                return <MapPin className="w-5 h-5" />;
            case 'hotel':
                return <HotelIcon className="w-5 h-5" />;
            case 'flight':
                return <Plane className="w-5 h-5" />;
            case 'salon':
                return <Scissors className="w-5 h-5" />;
        }
    };

    const getServiceTitle = () => {
        switch (bookingType) {
            case 'restaurant':
                return 'Restaurant Booking';
            case 'hotel':
                return 'Hotel Booking';
            case 'flight':
                return 'Flight Booking';
            case 'salon':
                return 'Salon Appointment';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getServiceIcon()}
                        {getServiceTitle()}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  

                    {step === 'service-selection' ? (
                        <div className="space-y-4">
                            <Label>Available Options</Label>
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4">
                                    {services.map((service) => (
                                        <ServiceCard
                                            key={service.id}
                                            service={service}
                                            type={bookingType}
                                            selected={selectedService?.id === service.id}
                                            onSelect={() => setSelectedService(service)}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        followUpQuestions.map((question, index) => (
                            <div
                                key={question}
                                className={`space-y-2 transition-all duration-200 ${
                                    index === step ? 'opacity-100' : 'opacity-50'
                                }`}
                            >
                                <Label>{question}</Label>
                                <Input
                                    value={answers[question] || ''}
                                    onChange={(e) => handleAnswer(question, e.target.value)}
                                    disabled={index !== step}
                                    placeholder="Your answer..."
                                />
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleNext}
                        disabled={
                            (step === 'service-selection' && !selectedService) ||
                            (typeof step === 'number' && (!answers[followUpQuestions[step]] || isProcessing))
                        }
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : step === 'service-selection' ? (
                            'Select and continue'
                        ) : typeof step === 'number' && step < followUpQuestions.length - 1 ? (
                            'Next'
                        ) : (
                            'Confirm Booking'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 