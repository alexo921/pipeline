import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Redirect to the backend Google OAuth endpoint
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    return NextResponse.redirect(backendUrl);
  } catch (error) {
    console.error('Google sign-in route error:', error);
    return NextResponse.json(
      { message: 'Failed to initiate Google sign-in' },
      { status: 500 }
    );
  }
} 