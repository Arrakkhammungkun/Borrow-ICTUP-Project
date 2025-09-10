import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, firstName, lastName, jobTitle, mobilePhone, officeLocation, displayName } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as { up_id: string; email: string; temp: boolean };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    if (!decoded.temp) {
      return NextResponse.json({ error: 'This token is not temporary.' }, { status: 400 });
    }

    // บันทึกข้อมูลในฐานข้อมูล
    await prisma.user.create({
      data: {
        up_id: decoded.up_id,
        email: decoded.email,
        first_name: firstName || '',
        last_name: lastName || '',
        jobTitle: jobTitle || '',
        mobilePhone: mobilePhone || '',
        officeLocation: officeLocation || '',
        displayName: displayName || '',
        updated_at: new Date(),
      },
    });

    // สร้าง token ใหม่ (ถาวร)
    const jwtPayload = {
      up_id: decoded.up_id,
      email: decoded.email,
    };
    const newToken = jwt.sign(jwtPayload, jwtSecret, { expiresIn: '7d' });

    return NextResponse.json({ success: true, token: newToken });
  } catch (error) {
    console.error('API: Error in /api/auth/create-profile:', error);
    return NextResponse.json({ error: 'Failed to create profile.', details: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch((err) => console.error('API: Failed to disconnect Prisma:', err));
  }
}