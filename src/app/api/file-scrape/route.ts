import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Add proper Next.js API route configuration
export const runtime = 'nodejs'; // Required for file processing
export const dynamic = 'force-dynamic'; // Ensure route is not cached

// Prevent static analysis during build
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(req: NextRequest) {
    let fileType: string;
    try {
        const { url, fileType: requestFileType } = await req.json();
        fileType = requestFileType;

        // Fetch the file
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${fileType} file`);
        }

        // Convert the response to buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let result;

        switch (fileType) {
            case 'pdf':
                const pdf = (await import('pdf-parse')).default;
                const pdfData = await pdf(buffer);
                result = {
                    text: pdfData.text,
                    title: (pdfData.info as any)?.Title || 'PDF Document',
                    metadata: pdfData.info,
                    numpages: pdfData.numpages
                };
                break;

            case 'doc':
            case 'docx':
                const docData = await mammoth.extractRawText({ buffer });
                result = {
                    text: docData.value,
                    messages: docData.messages
                };
                break;

            case 'txt':
            case 'csv':
            case 'json':
            case 'xml':
            case 'sql':
                // For text-based files, convert buffer to string
                const textContent = buffer.toString('utf-8');
                result = {
                    text: textContent
                };
                break;

            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('File processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process file' },
            { status: 500 }
        );
    }
} 