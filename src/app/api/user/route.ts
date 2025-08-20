import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

function getCurrentUserId(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as { up_id: string };
        return decoded.up_id;
      } catch (err) {
        console.error('Invalid token:', err);
        return null;
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const up_id = getCurrentUserId(request);

    if (!up_id) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { up_id },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('GET Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  const { accessToken } = await request.json();
  try {
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await graphResponse.json();

    let first_name = userData.givenName || userData.displayName?.split(' ')[0] || null;
    let last_name = userData.surname || userData.displayName?.split(' ').slice(1).join(' ') || null;

    const user = await prisma.user.upsert({
      where: { up_id: userData.id },
      update: {
        first_name,
        last_name,
        email: userData.mail || userData.userPrincipalName,
        jobTitle: userData.jobTitle,
        mobilePhone: userData.mobilePhone,
        officeLocation: userData.officeLocation,
        displayName: userData.displayName,
        updated_at: new Date(),
      },
      create: {
        up_id: userData.id,
        first_name,
        last_name,
        email: userData.mail || userData.userPrincipalName,
        jobTitle: userData.jobTitle,
        mobilePhone: userData.mobilePhone,
        officeLocation: userData.officeLocation,
        displayName: userData.displayName,
        updated_at: new Date(),
      },
    });
    return NextResponse.json({ success: true, user });
  } catch (err) {
    const error = err as Error;
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const data = await request.json();
  try {
    if (!data.up_id) {
      throw new Error('up_id is required for update');
    }

    const user = await prisma.user.update({
      where: { up_id: data.up_id },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        title: data.title,
        prefix: data.prefix,
        jobTitle: data.jobTitle,
        mobilePhone: data.mobilePhone,
        officeLocation: data.officeLocation,
        displayName: data.displayName,
        updated_at: new Date(),
      },
    });
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('Update Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}