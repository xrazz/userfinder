import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';

// Set runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

interface BookingRequest {
  restaurant: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  email: string;
  phone?: string;
  specialRequests?: string;
}

// Mock restaurant API integration - replace with actual booking API
async function makeRestaurantBooking(booking: BookingRequest) {
  // This is where you'd integrate with actual restaurant booking APIs
  // For now, we'll simulate a successful booking
  return {
    success: true,
    bookingId: `BOOK-${Math.random().toString(36).substr(2, 9)}`,
    restaurant: booking.restaurant,
    date: booking.date,
    time: booking.time,
    guests: booking.guests
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
          content: `You are a restaurant booking assistant. Extract booking details from user queries.
          Return a JSON object with the following fields:
          - restaurant (string, required)
          - date (YYYY-MM-DD format, required)
          - time (HH:mm format, required)
          - guests (number, required)
          - specialRequests (string, optional)
          
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
    const bookingRequest: BookingRequest = {
      ...parsedRequest,
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone
    };

    // Make the actual booking
    const bookingResult = await makeRestaurantBooking(bookingRequest);

    return NextResponse.json({
      success: true,
      booking: bookingResult
    });

  } catch (error) {
    console.error('Error processing restaurant booking:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the booking request.' },
      { status: 500 }
    );
  }
} 