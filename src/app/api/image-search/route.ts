import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebaseClient';

// Initialize Vision client with error handling
let vision: ImageAnnotatorClient;
try {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
    if (!credentials.project_id) {
        console.error('Invalid Google Cloud credentials: Missing project_id');
        throw new Error('Invalid Google Cloud credentials');
    }
    vision = new ImageAnnotatorClient({ credentials });
    console.log('Vision API client initialized successfully');
} catch (error) {
    console.error('Failed to initialize Vision client:', error);
}

export async function POST(request: Request) {
    try {
        // Check if Vision client is properly initialized
        if (!vision) {
            console.error('Vision API not properly configured');
            return NextResponse.json(
                { error: 'Vision API not properly configured' },
                { status: 500 }
            );
        }

        const { image, email } = await request.json();
        
        if (!image) {
            console.error('No image data provided');
            return NextResponse.json(
                { error: 'No image data provided' },
                { status: 400 }
            );
        }

        if (!email) {
            console.error('Email is required');
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check user credits
        const userDocRef = doc(db, 'users', email);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.error('User not found:', email);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;

        if (currentCredits <= 0) {
            console.error('Insufficient credits for user:', email);
            return NextResponse.json(
                { error: 'Insufficient credits' },
                { status: 403 }
            );
        }

        // Validate and process image data
        if (typeof image !== 'string' || !image.startsWith('data:image')) {
            console.error('Invalid image format provided');
            return NextResponse.json(
                { error: 'Invalid image format. Expected data URL' },
                { status: 400 }
            );
        }

        // Extract base64 data
        const base64Data = image.split(',')[1];
        if (!base64Data) {
            console.error('Invalid base64 image data');
            return NextResponse.json(
                { error: 'Invalid base64 image data' },
                { status: 400 }
            );
        }

        console.log('Processing image search for user:', email);
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Perform web detection with timeout
        const [result] = await Promise.race([
            vision.webDetection({ 
                image: { content: imageBuffer }
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Vision API timeout')), 30000)
            )
        ]);

        const webDetection = result.webDetection;
        if (!webDetection) {
            console.error('No web detection results found');
            return NextResponse.json(
                { error: 'No results found' },
                { status: 404 }
            );
        }

        // Extract and filter results
        const similarImages = (webDetection.visuallySimilarImages || [])
            .filter(img => img.url) // Only include results with valid URLs
            .map(img => ({
                url: img.url,
                score: img.score
            }));

        const webEntities = (webDetection.webEntities || [])
            .filter(entity => entity.description) // Only include results with descriptions
            .map(entity => ({
                description: entity.description,
                score: entity.score
            }));

        // Only deduct credit if we got results
        if (similarImages.length > 0 || webEntities.length > 0) {
            await updateDoc(userDocRef, {
                credits: currentCredits - 1
            });
            console.log('Credit deducted for user:', email);
        }

        console.log('Image search completed successfully');
        return NextResponse.json({
            similarImages,
            webEntities,
            message: similarImages.length === 0 ? 'No similar images found' : undefined
        });

    } catch (error) {
        console.error('Error processing image search:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Failed to process image search',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
} 