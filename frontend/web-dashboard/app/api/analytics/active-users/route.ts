import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';
    const limit = searchParams.get('limit') || '50';

    // Build query string
    const queryParams = new URLSearchParams({
      days,
      limit
    });

    // Forward the request to backend with cookies
    const response = await fetch(
      getApiUrl(`/analytics/active-users?${queryParams.toString()}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Forward the cookie header
          "Cookie": request.headers.get("cookie") || "",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: result.message || "Failed to fetch active users" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error [active users]:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 