import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      }
    );

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Signup failed", user: data.user },
        { status: backendRes.status }
      );
    }

    const setCookie = backendRes.headers.get("set-cookie");

    return NextResponse.json(
      {
        message: data.message,
        user: data.user, 
      },
      {
        status: 200,
        headers: setCookie ? { "set-cookie": setCookie } : undefined,
      }
    );
  } catch (err: any) {
    console.error("Signup route error:", err);
    return NextResponse.json(
      { message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
