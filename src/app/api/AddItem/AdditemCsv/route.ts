"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
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

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้", message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่มีข้อมูลครุภัณฑ์ในคำขอ" },
        { status: 400 }
      );
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    const invalidItems = items.filter(
      (item: any) =>
        !item.serialNumber ||
        !item.name ||
        !item.category ||
        !item.storageLocation ||
        !item.unit ||
        isNaN(item.total) ||
        item.total < 1 ||
        !["AVAILABLE", "UNAVAILABLE"].includes(item.status)
    );

    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลครุภัณฑ์บางรายการไม่ครบถ้วนหรือไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบ serialNumber ที่ซ้ำ
    const serialNumbers = items.map((item: any) => item.serialNumber);
    const existingItems = await prisma.equipment.findMany({
      where: {
        serialNumber: { in: serialNumbers },
      },
      select: { serialNumber: true },
    });

    const duplicateSerials = existingItems.map((item) => item.serialNumber);
    if (duplicateSerials.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `รหัสครุภัณฑ์ต่อไปนี้ซ้ำ: ${duplicateSerials.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // สร้างครุภัณฑ์ทั้งหมดใน transaction เดียว
    const newItems = await prisma.$transaction(
      items.map((item: any) =>
        prisma.equipment.create({
          data: {
            name: item.name,
            serialNumber: item.serialNumber,
            category: item.category,
            description: item.description || "",
            total: item.total,
            status: item.status,
            unit: item.unit,
            storageLocation: item.storageLocation,
            ownerId: user.id,
            feature: item.feature || "",
            availableQuantity: item.total,
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่ม ${newItems.length} รายการสำเร็จ`,
        data: newItems,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดในการสร้าง",
        message: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      },
      { status: 500 }
    );
  }
}