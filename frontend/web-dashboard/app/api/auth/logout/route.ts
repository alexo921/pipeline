import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Logged out successfully" },
    {
      status: 200,
      headers: {
        "Set-Cookie": `access_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
      },
    }
  );
}
