import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const res = await fetch(
      getApiUrl("/candidate/onboarding/verify-email"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: res.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
