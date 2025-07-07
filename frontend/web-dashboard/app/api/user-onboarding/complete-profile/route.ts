// app/api/user-onboarding/complete-profile/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/candidate/onboarding/complete-profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const result = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: result.message || "Failed to update profile" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Complete Profile API error:", err);
    return NextResponse.json(
      { message: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
