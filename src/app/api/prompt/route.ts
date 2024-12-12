import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { systemPrompt, userPrompt } = await request.json();

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'System and User prompts are required.' },
        { status: 400 }
      );
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