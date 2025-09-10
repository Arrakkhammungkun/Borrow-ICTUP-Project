"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.cookies.get("auth_token")?.value;
    console.log("token", token);
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

    const user = await prisma.user.findFirst({
      where: {
        up_id: decoded.up_id,
      },
    });

    console.log("User", user);
    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้", message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }
    const newItem = await prisma.equipment.create({
      data: {
        name: body.name,
        serialNumber: body.serialNumber,
        category: body.category,
        description: body.description,
        total: body.total,
        status: body.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
        unit: body.unit,
        storageLocation: body.storageLocation,
        ownerId: user.id,
        feature: body.feature || "",
        availableQuantity: body.total,
      },
    });
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "เลข Serial Number นี้ถูกใช้งานแล้ว",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการสร้าง", message: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" },
      { status: 500 }
    );
  }
}
