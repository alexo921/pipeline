import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Call backend API
    const backendRes = await fetch(
      getApiUrl("/auth/login"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Login failed" },
        { status: backendRes.status }
      );
    }

    // Create response with data
    const response = NextResponse.json(data, { status: 200 });

    // Get the 'set-cookie' header from backend response and set it
    const setCookieHeader = backendRes.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch (err: any) {
    console.error('Login route error:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
