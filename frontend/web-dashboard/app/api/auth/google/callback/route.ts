import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Forward the request to backend with query parameters
    const backendUrl = getApiUrl("/auth/google/callback") + request.nextUrl.search;
    return NextResponse.redirect(backendUrl);
  } catch (error) {
    console.error('Google callback route error:', error);
    return NextResponse.json(
      { message: 'Failed to handle Google callback' },
      { status: 500 }
    );
  }
} 