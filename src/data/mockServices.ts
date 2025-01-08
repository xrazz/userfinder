export interface Hotel {
    id: string;
    name: string;
    address: string;
    phone: string;
    rating: number;
    reviews: number;
    priceRange: string;
    stars: number;
    amenities: string[];
    accessibility: string[];
    roomTypes: string[];
    checkIn: string;
    checkOut: string;
    description: string;
}

export interface Flight {
    id: string;
    airline: string;
    flightNumber: string;
    departure: {
        city: string;
        airport: string;
        code: string;
        time: string;
    };
    arrival: {
        city: string;
        airport: string;
        code: string;
        time: string;
    };
    duration: string;
    price: string;
    class: string[];
    amenities: string[];
}

export interface Salon {
    id: string;
    name: string;
    address: string;
    phone: string;
    rating: number;
    reviews: number;
    priceRange: string;
    services: string[];
    accessibility: string[];
    openingHours: string;
    description: string;
    stylists: string[];
}

export const mockHotels: Hotel[] = [
    {
        id: "hotel1",
        name: "Grand Hotel Plaza",
        address: "Via del Corso 126, 00186 Roma RM",
        phone: "+39 06 1234 5678",
        rating: 4.7,
        reviews: 2345,
        priceRange: "€200-500",
        stars: 5,
        amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Bar", "Gym"],
        accessibility: ["Wheelchair accessible", "Elevator", "Accessible parking"],
        roomTypes: ["Single", "Double", "Suite", "Presidential Suite"],
        checkIn: "15:00",
        checkOut: "11:00",
        description: "Luxury hotel in the heart of Rome"
    },
    // Add more hotels...
];

export const mockFlights: Flight[] = [
    {
        id: "flight1",
        airline: "Alitalia",
        flightNumber: "AZ1234",
        departure: {
            city: "Rome",
            airport: "Fiumicino",
            code: "FCO",
            time: "10:00"
        },
        arrival: {
            city: "Paris",
            airport: "Charles de Gaulle",
            code: "CDG",
            time: "12:00"
        },
        duration: "2h",
        price: "€150",
        class: ["Economy", "Business", "First"],
        amenities: ["Meal", "WiFi", "Entertainment"]
    },
    // Add more flights...
];

export const mockSalons: Salon[] = [
    {
        id: "salon1",
        name: "Style & Beauty",
        address: "Via Veneto 45, 00187 Roma RM",
        phone: "+39 06 9876 5432",
        rating: 4.8,
        reviews: 567,
        priceRange: "€30-150",
        services: ["Haircut", "Color", "Styling", "Treatment", "Manicure", "Pedicure"],
        accessibility: ["Wheelchair accessible"],
        openingHours: "09:00-19:00",
        description: "Premium beauty salon with expert stylists",
        stylists: ["Marco", "Sofia", "Giulia", "Alessandro"]
    },
    // Add more salons...
]; 