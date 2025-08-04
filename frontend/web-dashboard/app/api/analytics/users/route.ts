import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    // Build query string
    const queryParams = new URLSearchParams({
      limit,
      offset
    });
    if (search) {
      queryParams.append('search', search);
    }
    if (role) {
      queryParams.append('role', role);
    }

    // Forward the request to backend with cookies
    const response = await fetch(
      getApiUrl(`/analytics/users?${queryParams.toString()}`),
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
        { message: result.message || "Failed to fetch users" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error [users]:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 