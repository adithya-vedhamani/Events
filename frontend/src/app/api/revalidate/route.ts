import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { token, tag } = await request.json();

    // Verify the revalidation token (you should set this in your environment)
    if (token !== process.env.REVALIDATION_TOKEN) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Revalidate the specified tag
    if (tag) {
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    }

    return NextResponse.json({ 
      message: 'Revalidation successful',
      revalidated: tag ? true : false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { message: 'Revalidation failed' }, 
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for manual revalidation (for development)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const token = searchParams.get('token');

  if (token !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (tag) {
    revalidateTag(tag);
    console.log(`Manually revalidated tag: ${tag}`);
  }

  return NextResponse.json({ 
    message: 'Manual revalidation successful',
    revalidated: tag ? true : false,
    timestamp: new Date().toISOString()
  });
} 