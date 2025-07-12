import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // validation
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Valid email is required" },
        { status: 400 }
      );
    }


    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.json();
      return NextResponse.json(
        { message: errorData.message || "Something went wrong" },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Forgot-password route error:", err);
    return NextResponse.json(
      { message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
