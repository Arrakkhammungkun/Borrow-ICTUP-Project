import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;
export async function GET(req: NextRequest) {
  try {
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
        { error: "Invalid token", message: `JWT Error: ${jwtErr.message}` },
        { status: 401 }
      );
    }


    const user = await prisma.user.findUnique({
      where: {
        up_id: decoded.up_id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", message: "ไม่พบผู้ใช้จาก token" },
        { status: 404 }
      );
    }

    const userId = user.id;
    const equipments = await prisma.equipment.findMany({
      where: {
        status: "AVAILABLE",
        availableQuantity: {
          gt: 0,
        },
        ownerId: {
          not: userId, 
        },
      },
      include: {
        owner: true,
      }, 
    });

    const formattedEquipments = equipments.map((e) => ({
      id: e.equipment_id,
      code: e.serialNumber,
      name: e.name,
      unit: e.unit,
      owner:
        e.owner.displayName ||
        `${e.owner.prefix || ""} ${e.owner.first_name || ""} ${e.owner.last_name || ""}`.trim() ||
        "ไม่ระบุเจ้าของ",
      quantity: e.total, 
      availableQuantity: e.availableQuantity,
    }));

    return NextResponse.json(formattedEquipments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
