  import { NextRequest, NextResponse } from 'next/server';
  import jwt from 'jsonwebtoken';
  import prisma from '@/lib/db';

  export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { token } = body;

      if (!token) {
        return NextResponse.json({ success: false, error: 'No token provided.' }, { status: 400 });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
      }

      const decodedToken = jwt.verify(token, jwtSecret) as { up_id: string; email: string; temp?: boolean };
      const existingUser = await prisma.user.findUnique({
        where: { up_id: decodedToken.up_id },
      });

      return NextResponse.json({ success: true, userExists: !!existingUser });
    } catch (error) {
      console.error('API: Error in /api/auth/process-msal-login/check:', error);
      return NextResponse.json({ success: false, error: 'Invalid token.', details: (error as Error).message }, { status: 401 });
    } finally {
      await prisma.$disconnect().catch((err) => console.error('API: Failed to disconnect Prisma:', err));
    }
  }