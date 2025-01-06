import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebaseClient';

const vision = new ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}')
});

export async function POST(request: Request) {
  try {
    const { image, email } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (typeof image !== 'string') {
      return NextResponse.json({ error: 'Invalid image format. Expected base64 string' }, { status: 400 });
    }

    // Ensure the image is a valid base64 data URL
    if (!image.startsWith('data:image')) {
      return NextResponse.json({ error: 'Invalid image format. Expected data URL' }, { status: 400 });
    }

    // Check user credits
    const userDocRef = doc(db, 'users', email);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentCredits = userData.credits || 0;

    if (currentCredits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
    }
    
    // Convert base64 to buffer
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid base64 image data' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Perform web detection
    const [result] = await vision.webDetection({
      image: {
        content: imageBuffer
      }
    });
    
    const webDetection = result.webDetection;
    
    if (!webDetection) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }
    
    // Extract similar images and web entities
    const similarImages = webDetection.visuallySimilarImages || [];
    const webEntities = webDetection.webEntities || [];

    // Deduct one credit after successful search
    await updateDoc(userDocRef, {
      credits: currentCredits - 1
    });
    
    return NextResponse.json({
      similarImages: similarImages.map(img => ({
        url: img.url,
        score: img.score
      })),
      webEntities: webEntities.map(entity => ({
        description: entity.description,
        score: entity.score
      }))
    });
    
  } catch (error) {
    console.error('Error processing image search:', error);
    return NextResponse.json({ error: 'Failed to process image search' }, { status: 500 });
  }
} 