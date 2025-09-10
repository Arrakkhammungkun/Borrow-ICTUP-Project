import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { graphData } = body;

    if (!graphData || !graphData.id || !graphData.mail) {
      return NextResponse.json({ error: 'Missing required user data from Graph API.' }, { status: 400 });
    }

    const upId = graphData.id;
    const email = graphData.mail;
    const firstName = graphData.givenName || null;
    const lastName = graphData.surname || null;
    const jobTitle = graphData.jobTitle || null;
    const mobilePhone = graphData.mobilePhone || null;

    const existingUser = await prisma.user.findUnique({ where: { up_id: upId } });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const token = jwt.sign(
      { up_id: upId, email, temp: !existingUser },
      jwtSecret,
      { expiresIn: existingUser ? '7d' : '7d' }
    );

    const response = NextResponse.json({
      success: true,
      token,
      userExists: !!existingUser,
      ...(existingUser ? {} : { initialData: { upId, email, firstName, lastName, jobTitle, mobilePhone } }),
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: existingUser ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 7, 
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('API: Uncaught error:', error);
    return NextResponse.json({ error: 'Internal server error.', details: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch((err) => console.error('API: Prisma disconnect error:', err));
  }
}
