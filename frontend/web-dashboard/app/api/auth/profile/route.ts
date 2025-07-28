import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const accessToken = cookies?.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { message: "No access token found" },
        { status: 401 }
      );
    }

    // Call backend API to get profile
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: result.message || "Failed to get profile" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error [profile]:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 