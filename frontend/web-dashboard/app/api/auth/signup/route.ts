import { NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend API
    const response = await fetch(getApiUrl("/auth/signup"), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Signup failed' },
        { status: response.status }
      );
    }

    // Set the auth cookie from the backend response
    const responseHeaders = new Headers();
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      responseHeaders.set('set-cookie', setCookieHeader);
    }

    return NextResponse.json(data, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 