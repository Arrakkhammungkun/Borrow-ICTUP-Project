import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("API: Received complete-profile request:", body);
    const { up_id, email, first_name, last_name, title, prefix, jobTitle, mobilePhone, officeLocation, displayName } = body;

    //const authHeader = req.headers.get("Authorization");
    //const token = authHeader?.split(" ")[1];
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      console.error("API: No token provided in Authorization header.");
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const decodedToken = jwt.decode(token) as { up_id: string; email: string; temp: boolean };
    if (!decodedToken || !decodedToken.temp) {
      console.error("API: Invalid or non-temporary token.");
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    const requiredFields = ["up_id", "email", "first_name", "last_name", "jobTitle", "displayName"];
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      console.error("API: Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && existingEmail.up_id !== up_id) {
      console.error("API: Email is already in use by another account:", email);
      return NextResponse.json({ error: "Email is already in use by another account." }, { status: 409 });
    }

    const user = await prisma.user.upsert({
      where: { up_id },
      update: {
        email,
        first_name,
        last_name,
        title,
        prefix,
        jobTitle,
        mobilePhone,
        officeLocation,
        displayName,
        updated_at: new Date(),
      },
      create: {
        up_id,
        email,
        first_name,
        last_name,
        title,
        prefix,
        jobTitle,
        mobilePhone,
        officeLocation,
        displayName,
        updated_at: new Date(),
      },
    });

    console.log(`API: User ${user.email} (${user.up_id}) saved in database. User data:`, user);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("API: JWT_SECRET is not defined in environment variables.");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const jwtPayload = { up_id: user.up_id, email: user.email };
    const newToken = jwt.sign(jwtPayload, jwtSecret, { expiresIn: "7d" });

    const response = NextResponse.json({ success: true, token: newToken });
    response.cookies.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: "/",
      sameSite: "lax",
    });

    console.log("API: New auth token cookie set successfully. Response:", response);
    return response;
  } catch (error) {
    console.error("API: Error in /api/auth/create-profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile.", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch((err) => console.error("API: Failed to disconnect Prisma:", err));
  }
}