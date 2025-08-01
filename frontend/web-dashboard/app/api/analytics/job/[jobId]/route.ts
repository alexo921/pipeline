import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Forward the request to backend with cookies
    const response = await fetch(
      getApiUrl(`/analytics/job/${params.jobId}`) + request.nextUrl.search,
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
        { message: result.message || "Failed to fetch job analytics" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error [analytics/job]:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 