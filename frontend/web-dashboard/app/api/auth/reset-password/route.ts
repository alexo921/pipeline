import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword, confirmPassword } = await request.json();

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: 'Token, new password, and confirm password are required' },
        { status: 400 }
      );
    }

    const backendRes = await fetch(
      getApiUrl("/auth/reset-password"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      }
    );

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || 'Password reset failed' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);

  } catch (err: any) {
    console.error('Reset password route error:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
