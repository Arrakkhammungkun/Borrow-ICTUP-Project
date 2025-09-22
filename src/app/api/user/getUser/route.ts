"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get("auth_token")?.value;
    
    if (!token) {
      console.error("API: No token provided in Authorization header.");
      return NextResponse.json(
        {
          error: "Authentication required.",
          message: "ไม่ได้ส่ง token มาด้วย",
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as { up_id: string };
    } catch (jwtErr: any) {
      return NextResponse.json(
        { success: false, message: `JWT Error: ${jwtErr.message}` },
        { status: 401 }
      );
    }

    if (!decoded.up_id) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        up_id: decoded.up_id,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        prefix: true,
        title: true,
        jobTitle: true,
        mobilePhone: true,
        officeLocation: true,
        displayName: true,
        up_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้", message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Get profile error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์",
        message: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      },
      { status: 500 }
    );
  }
}