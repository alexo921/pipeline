import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';
    const eventType = searchParams.get('eventType') || '';
    const days = searchParams.get('days') || '30';

    // Build query string
    const queryParams = new URLSearchParams({
      limit,
      offset,
      days
    });
    if (eventType) {
      queryParams.append('eventType', eventType);
    }

    // Forward the request to backend with cookies
    const response = await fetch(
      getApiUrl(`/analytics/events/batch?${queryParams.toString()}`),
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
        { message: result.message || "Failed to fetch analytics events" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error [analytics events]:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to backend with cookies
    const response = await fetch(
      getApiUrl("/analytics/events/batch"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward the cookie header
          "Cookie": request.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: result.message || "Failed to send analytics events" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error [analytics events]:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 