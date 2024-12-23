import { NextResponse } from 'next/server';
import OpenAI from 'openai';
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return NextResponse.json({
      output: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the prompt.' },
      { status: 500 }
    );
  }
}