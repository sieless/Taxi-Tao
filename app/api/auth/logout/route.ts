import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the new session cookie
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Clear the legacy cookie (for users who haven't migrated yet)
  response.cookies.set("firebase-auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
