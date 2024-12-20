import { NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/app/firebaseClient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { systemPrompt, userPrompt, email } = await request.json();

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'System and User prompts are required.' },
        { status: 400 }
      );
    }

    // Handle credits check and deduction
    if (email) {
      // Registered user
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentCredits = userDoc.data().credits;
        
        if (currentCredits <= 0) {
          return NextResponse.json(
            { error: 'No credits remaining. Credits reset daily.' },
            { status: 403 }
          );
        }

        // Deduct credit
        await updateDoc(userRef, {
          credits: currentCredits - 1
        });
      }
    } else {
      // Guest user - handle credits through cookies
      const cookieStore = cookies();
      const guestCredits = parseInt(cookieStore.get('guestCredits')?.value || '3');
      
      if (guestCredits <= 0) {
        return NextResponse.json(
          { error: 'No guest credits remaining. Please sign up for more credits.' },
          { status: 403 }
        );
      }

      // Deduct guest credit and update cookie
      cookieStore.set('guestCredits', (guestCredits - 1).toString(), {
        expires: new Date(new Date().setHours(24, 0, 0, 0)) // Expires at midnight
      });
    }

    const payload = {
      stream: false,
      system: "groq",
      modelId: "mixtral-8x7b-32768",
      messages: [
        {
          name: "system",
          content: systemPrompt,
          role: "system",
        },
        {
          name: "user",
          content: userPrompt,
          role: "user",
        },
      ],
    };

    const headers = {
      'x-api-key': 'udsk_n8vrdUwlvWa32M1yEOYWGdyb3FYgpqMuwGqGLHN4F9IShOX9Jbh',
    };

    const aiResponse = await axios.post('https://dev.undrstnd-labs.com/api', payload, { headers });

    return NextResponse.json({
      output: aiResponse.data.output,
      funding: aiResponse.data.funding,
      usage: aiResponse.data.usage,
    });
  } catch (error) {
    console.error('Error communicating with AI model:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the prompt.' },
      { status: 500 }
    );
  }
}