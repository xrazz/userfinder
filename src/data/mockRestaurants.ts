export interface Restaurant {
    id: string;
    name: string;
    address: string;
    phone: string;
    rating: number;
    reviews: number;
    priceRange: string;
    cuisine: string;
    services: string[];
    accessibility: string[];
    reservations: boolean;
    openingHours: string;
    description: string;
}

export const mockRestaurants: Restaurant[] = [
    {
        id: "rest1",
        name: "Trattoria Pizzeria La Follia",
        address: "Via Ostilia, 24/24a, 00184 Roma RM",
        phone: "+39 06 4547 7438",
        rating: 4.2,
        reviews: 1203,
        priceRange: "€10-20",
        cuisine: "Italian",
        services: ["Dine-in", "Delivery", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "12:00-23:00",
        description: "Authentic Roman cuisine in the heart of the city"
    },
    {
        id: "rest2",
        name: "Ristorante Da Mario",
        address: "Via del Corso 123, 00186 Roma RM",
        phone: "+39 06 1234 5678",
        rating: 4.5,
        reviews: 2150,
        priceRange: "€30-50",
        cuisine: "Italian",
        services: ["Dine-in", "Takeout"],
        accessibility: ["Wheelchair accessible", "Accessible parking"],
        reservations: true,
        openingHours: "19:00-23:30",
        description: "Fine dining Italian restaurant with extensive wine selection"
    },
    {
        id: "rest3",
        name: "Osteria del Poeta",
        address: "Via Trastevere 45, 00153 Roma RM",
        phone: "+39 06 8765 4321",
        rating: 4.7,
        reviews: 890,
        priceRange: "€20-40",
        cuisine: "Italian",
        services: ["Dine-in"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "18:30-23:00",
        description: "Traditional Roman dishes in a cozy atmosphere"
    },
    {
        id: "rest4",
        name: "Sushi Zen",
        address: "Via Nazionale 78, 00184 Roma RM",
        phone: "+39 06 9876 5432",
        rating: 4.4,
        reviews: 756,
        priceRange: "€25-45",
        cuisine: "Japanese",
        services: ["Dine-in", "Delivery", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "12:00-15:00, 19:00-23:00",
        description: "Contemporary Japanese cuisine and fresh sushi"
    },
    {
        id: "rest5",
        name: "El Tapas",
        address: "Via Veneto 156, 00187 Roma RM",
        phone: "+39 06 2345 6789",
        rating: 4.3,
        reviews: 678,
        priceRange: "€15-35",
        cuisine: "Spanish",
        services: ["Dine-in", "Takeout"],
        accessibility: ["Wheelchair accessible", "Accessible restroom"],
        reservations: true,
        openingHours: "18:00-01:00",
        description: "Authentic Spanish tapas and sangria"
    },
    {
        id: "rest6",
        name: "Pizzeria Napoli",
        address: "Via Tiburtina 234, 00185 Roma RM",
        phone: "+39 06 3456 7890",
        rating: 4.6,
        reviews: 1567,
        priceRange: "€10-25",
        cuisine: "Italian",
        services: ["Dine-in", "Delivery", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "12:00-23:00",
        description: "Authentic Neapolitan pizza"
    },
    {
        id: "rest7",
        name: "Le Petit Bistrot",
        address: "Via Cola di Rienzo 89, 00192 Roma RM",
        phone: "+39 06 4567 8901",
        rating: 4.4,
        reviews: 432,
        priceRange: "€35-60",
        cuisine: "French",
        services: ["Dine-in"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "19:00-23:00",
        description: "Classic French cuisine in an elegant setting"
    },
    {
        id: "rest8",
        name: "Trattoria della Nonna",
        address: "Via Appia Nuova 567, 00179 Roma RM",
        phone: "+39 06 5678 9012",
        rating: 4.8,
        reviews: 987,
        priceRange: "€20-35",
        cuisine: "Italian",
        services: ["Dine-in", "Takeout"],
        accessibility: ["Wheelchair accessible", "Accessible parking"],
        reservations: true,
        openingHours: "12:00-15:00, 19:00-22:30",
        description: "Home-style Italian cooking"
    },
    {
        id: "rest9",
        name: "Dragon Wok",
        address: "Via Tuscolana 789, 00175 Roma RM",
        phone: "+39 06 6789 0123",
        rating: 4.1,
        reviews: 543,
        priceRange: "€15-30",
        cuisine: "Chinese",
        services: ["Dine-in", "Delivery", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "11:30-23:00",
        description: "Traditional Chinese cuisine"
    },
    {
        id: "rest10",
        name: "La Pergola",
        address: "Via Alberto Cadlolo 101, 00136 Roma RM",
        phone: "+39 06 7890 1234",
        rating: 4.9,
        reviews: 1890,
        priceRange: "€150-300",
        cuisine: "Italian",
        services: ["Dine-in"],
        accessibility: ["Wheelchair accessible", "Valet parking"],
        reservations: true,
        openingHours: "19:30-23:00",
        description: "Three Michelin-starred restaurant with panoramic views"
    },
    {
        id: "rest11",
        name: "Maharaja Palace",
        address: "Via Barberini 123, 00187 Roma RM",
        phone: "+39 06 8901 2345",
        rating: 4.3,
        reviews: 678,
        priceRange: "€20-40",
        cuisine: "Indian",
        services: ["Dine-in", "Delivery", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "12:00-15:00, 19:00-23:00",
        description: "Authentic Indian cuisine"
    },
    {
        id: "rest12",
        name: "Taverna Greca",
        address: "Via del Boschetto 45, 00184 Roma RM",
        phone: "+39 06 9012 3456",
        rating: 4.4,
        reviews: 432,
        priceRange: "€15-35",
        cuisine: "Greek",
        services: ["Dine-in", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "18:00-23:30",
        description: "Traditional Greek dishes and mezedes"
    },
    {
        id: "rest13",
        name: "Hostaria Romana",
        address: "Via del Boccaccio 1, 00187 Roma RM",
        phone: "+39 06 0123 4567",
        rating: 4.7,
        reviews: 1234,
        priceRange: "€25-45",
        cuisine: "Italian",
        services: ["Dine-in"],
        accessibility: ["Wheelchair accessible", "Accessible restroom"],
        reservations: true,
        openingHours: "12:30-15:00, 19:00-23:00",
        description: "Classic Roman dishes in a historic setting"
    },
    {
        id: "rest14",
        name: "Burger House",
        address: "Via Nomentana 789, 00161 Roma RM",
        phone: "+39 06 1234 5678",
        rating: 4.2,
        reviews: 567,
        priceRange: "€10-25",
        cuisine: "American",
        services: ["Dine-in", "Delivery", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "12:00-23:00",
        description: "Gourmet burgers and American classics"
    },
    {
        id: "rest15",
        name: "Ramen Bar",
        address: "Via dei Serpenti 34, 00184 Roma RM",
        phone: "+39 06 2345 6789",
        rating: 4.5,
        reviews: 345,
        priceRange: "€15-25",
        cuisine: "Japanese",
        services: ["Dine-in", "Takeout"],
        accessibility: ["Wheelchair accessible"],
        reservations: true,
        openingHours: "12:00-15:00, 18:00-22:30",
        description: "Authentic Japanese ramen and side dishes"
    }
]; 