import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';

// Set runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

interface TravelBooking {
  type: 'flight' | 'hotel' | 'package';
  departure?: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  roomType?: string;
  guests?: number;
  name: string;
  email: string;
  phone?: string;
  preferences?: {
    class?: 'economy' | 'business' | 'first';
    meals?: string[];
    seatPreference?: 'window' | 'aisle';
    hotelAmenities?: string[];
  };
}

// Mock travel booking API integration
async function makeTravelBooking(booking: TravelBooking) {
  // This is where you'd integrate with actual travel booking APIs
  // For now, we'll simulate a successful booking
  return {
    success: true,
    bookingId: `TRAVEL-${Math.random().toString(36).substr(2, 9)}`,
    type: booking.type,
    destination: booking.destination,
    departureDate: booking.departureDate,
    returnDate: booking.returnDate,
    confirmation: {
      flight: booking.type === 'flight' || booking.type === 'package' ? {
        flightNumber: `FL${Math.floor(Math.random() * 1000)}`,
        seat: 'TBD'
      } : undefined,
      hotel: booking.type === 'hotel' || booking.type === 'package' ? {
        hotelName: 'Sample Hotel',
        roomNumber: 'TBD'
      } : undefined
    }
  };
}

export async function POST(request: Request) {
  try {
    const { query, userInfo } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // First, use GPT-4 to parse the natural language request
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a travel booking assistant. Extract booking details from user queries.
          Return a JSON object with the following fields:
          - type ('flight', 'hotel', or 'package')
          - departure (for flights)
          - destination
          - departureDate (YYYY-MM-DD format)
          - returnDate (YYYY-MM-DD format, for round trips)
          - passengers (for flights)
          - hotelCheckIn (YYYY-MM-DD format, for hotels)
          - hotelCheckOut (YYYY-MM-DD format, for hotels)
          - roomType (for hotels)
          - guests (for hotels)
          - preferences (object with optional fields: class, meals, seatPreference, hotelAmenities)
          
          Only respond with valid JSON. If any required information is missing, include a "missingInfo" array listing the missing fields.`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedRequest = JSON.parse(response.choices[0].message.content || '{}');

    // Check if we have all required information
    if (parsedRequest.missingInfo && parsedRequest.missingInfo.length > 0) {
      return NextResponse.json({
        success: false,
        needsMoreInfo: true,
        missingInfo: parsedRequest.missingInfo,
        currentInfo: parsedRequest
      });
    }

    // Add user information to the booking request
    const bookingRequest: TravelBooking = {
      ...parsedRequest,
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone
    };

    // Make the actual booking
    const bookingResult = await makeTravelBooking(bookingRequest);

    return NextResponse.json({
      success: true,
      booking: bookingResult
    });

  } catch (error) {
    console.error('Error processing travel booking:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the booking request.' },
      { status: 500 }
    );
  }
} 