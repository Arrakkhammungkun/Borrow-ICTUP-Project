import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest) {
  try {
    
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, 
      path: '/',
      sameSite: 'lax',
    });



    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error.', details: (error as Error).message }, { status: 500 });
  }
}