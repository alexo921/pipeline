import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Redirect to the backend Google OAuth endpoint
    const backendUrl = getApiUrl("/auth/google");
    return NextResponse.redirect(backendUrl);
  } catch (error) {
    console.error('Google sign-in route error:', error);
    return NextResponse.json(
      { message: 'Failed to initiate Google sign-in' },
      { status: 500 }
    );
  }
} 