// /api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ authenticated: false, error: "Token expired" });
    } else if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ authenticated: false, error: "Invalid token" });
    } else {
      return NextResponse.json({ authenticated: false, error: "Unknown error" });
    }
  }
}
