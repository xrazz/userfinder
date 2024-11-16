// app/api/authcheck/route.ts
import admin from '@/app/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const token = req.headers.get('Authorization')?.split(' ')[1]; // Expecting 'Bearer <token>'
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return NextResponse.json({ uid: decodedToken.uid, message: 'User is authenticated' }, { status: 200 });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
}
