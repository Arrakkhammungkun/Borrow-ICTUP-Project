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
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, jwtSecret) as { up_id: string };
    if (!decoded.up_id) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        up_id: decoded.up_id,
      },
    });
    
    console.log(user);
    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
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
        state: body.state,
        ownerId: user.id,
      },
    });
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการสร้าง", err },
      { status: 500 }
    );
  }
}
