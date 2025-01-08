import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { mockRestaurants } from '@/data/mockRestaurants'
import { mockHotels, mockFlights, mockSalons } from '@/data/mockServices'

export async function POST(request: Request) {
    try {
        const { query, isAiMode, email } = await request.json();

        // Check if AI mode is active but user is not logged in
        if (isAiMode && !email) {
            return NextResponse.json({ 
                error: 'Authentication required',
                message: 'Please sign in to use AI-powered search',
                requiresAuth: true
            }, { status: 401 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // First, analyze the intent
        const intentResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a multilingual assistant that helps identify the type of search request.

Analyze the user's query to determine if it falls into one of these categories:
1. BOOKING REQUEST - When the user explicitly wants to make a reservation/booking for:
   - Restaurant table
   - Flight ticket
   - Hotel room
   - Salon appointment

2. DOCUMENT SEARCH - ONLY when the user explicitly mentions file types or document formats like:
   - "pdf", "document", "doc", "docx"
   - "spreadsheet", "xlsx", "xls", "csv"
   - "presentation", "ppt", "pptx"
   - "txt", "text file"
   - "json", "xml"
   Examples:
   - "find python documentation in pdf"
   - "download csv of stock prices"
   - "search for research papers pdf"
   Note: Do NOT classify as document search unless these file type keywords are present!

3. NORMAL SEARCH - Any other type of search:
   - General information queries (even about documents if no file type mentioned)
   - News searches
   - Product searches
   - Learning/tutorial requests
   - Research or academic queries without specific file type mention
   Examples of NORMAL (not document) searches:
   - "find python documentation" (no file type mentioned)
   - "search for research papers about AI" (no file type mentioned)
   - "find technical documentation" (no file type mentioned)

Return your response in this exact JSON format:
{
    "type": "normal" or "document" or "booking",
    "confidence": number between 0 and 1,
    "details": {
        // For booking:
        "bookingType": "restaurant" or "hotel" or "flight" or "salon" (only if type is "booking"),
        "needsFollowUp": boolean (only if type is "booking"),
        "followUpQuestions": string[] (only if needsFollowUp is true)
        
        // For document:
        "fileType": "pdf" or "doc" or "xls" or "ppt" or "any" (only if type is "document"),
        "topic": string (only if type is "document")
        
        // For normal:
        "searchIntent": string (brief description of what user is looking for)
    }
}

Examples:

"I want to book a table for dinner tonight"
{
    "type": "booking",
    "confidence": 0.95,
    "details": {
        "bookingType": "restaurant",
        "needsFollowUp": true,
        "followUpQuestions": [
            "How many people are in your party?",
            "What time would you like to dine?",
            "Do you have any cuisine preferences?"
        ]
    }
}

"Find Python documentation PDF"
{
    "type": "document",
    "confidence": 0.9,
    "details": {
        "fileType": "pdf",
        "topic": "Python documentation"
    }
}

"What is machine learning?"
{
    "type": "normal",
    "confidence": 0.95,
    "details": {
        "searchIntent": "Understanding the concept of machine learning"
    }
}

"Looking for research papers about AI"
{
    "type": "normal",
    "confidence": 0.85,
    "details": {
        "searchIntent": "Finding AI research papers"
    }
}

"Show me Italian restaurants in Rome"
{
    "type": "normal",
    "confidence": 0.8,
    "details": {
        "searchIntent": "Finding Italian restaurants in Rome"
    }
}

"I need to book a flight to Paris"
{
    "type": "booking",
    "confidence": 0.9,
    "details": {
        "bookingType": "flight",
        "needsFollowUp": true,
        "followUpQuestions": [
            "When would you like to travel?",
            "Is this a one-way or round trip?",
            "What is your preferred class of travel?"
        ]
    }
}`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const intentAnalysis = JSON.parse(intentResponse.choices[0].message.content || '{}');

        // Handle different types of searches
        if (intentAnalysis.type === 'normal') {
            return NextResponse.json({ isBooking: false });
        }

        if (intentAnalysis.type === 'document') {
            return NextResponse.json({ 
                isBooking: false,
                isDocumentSearch: true,
                fileType: intentAnalysis.details.fileType,
                topic: intentAnalysis.details.topic
            });
        }

        // If it's a booking request with high confidence
        if (intentAnalysis.type === 'booking' && intentAnalysis.confidence > 0.7) {
            if (intentAnalysis.details.needsFollowUp) {
                return NextResponse.json({
                    isBooking: true,
                    type: intentAnalysis.details.bookingType,
                    needsFollowUp: true,
                    followUpQuestions: intentAnalysis.details.followUpQuestions,
                    currentDetails: intentAnalysis.details
                });
            }

            // Mock booking process
            let bookingResult;
            switch (intentAnalysis.details.bookingType) {
                case 'restaurant':
                    const eligibleRestaurants = intentAnalysis.details.cuisine 
                        ? mockRestaurants.filter(r => 
                            r.cuisine.toLowerCase() === intentAnalysis.details.cuisine.toLowerCase())
                        : mockRestaurants;
                    
                    const restaurant = eligibleRestaurants.length > 0 
                        ? eligibleRestaurants[Math.floor(Math.random() * eligibleRestaurants.length)]
                        : mockRestaurants[Math.floor(Math.random() * mockRestaurants.length)];

                    bookingResult = {
                        type: 'restaurant',
                        booking: {
                            id: `RES-${Math.random().toString(36).substr(2, 9)}`,
                            restaurant,
                            details: intentAnalysis.details,
                            status: 'confirmed'
                        }
                    };
                    break;

                case 'hotel':
                    const hotel = mockHotels[0]; // For now, just use the first hotel
                    bookingResult = {
                        type: 'hotel',
                        booking: {
                            id: `HOT-${Math.random().toString(36).substr(2, 9)}`,
                            hotel,
                            details: intentAnalysis.details,
                            status: 'confirmed'
                        }
                    };
                    break;

                case 'flight':
                    const flight = mockFlights[0]; // For now, just use the first flight
                    bookingResult = {
                        type: 'flight',
                        booking: {
                            id: `FLT-${Math.random().toString(36).substr(2, 9)}`,
                            flight,
                            details: intentAnalysis.details,
                            status: 'confirmed'
                        }
                    };
                    break;

                case 'salon':
                    const salon = mockSalons[0]; // For now, just use the first salon
                    bookingResult = {
                        type: 'salon',
                        booking: {
                            id: `SAL-${Math.random().toString(36).substr(2, 9)}`,
                            salon,
                            details: intentAnalysis.details,
                            status: 'confirmed'
                        }
                    };
                    break;

                default:
                    return NextResponse.json({ 
                        isBooking: false,
                        error: 'Unsupported booking type'
                    });
            }

            return NextResponse.json({
                isBooking: true,
                ...bookingResult
            });
        }

        return NextResponse.json({ 
            isBooking: false,
            error: 'Failed to process booking intent'
        }, { status: 500 });

    } catch (error) {
        console.error('Error processing booking intent:', error);
        return NextResponse.json({ 
            isBooking: false,
            error: 'Failed to process booking intent'
        }, { status: 500 });
    }
} 