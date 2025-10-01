import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, context: any) {
  try {
    const token =
      req.headers.get("authorization")?.split(" ")[1] ||
      req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "ต้องมีการตรวจสอบสิทธิ์" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret"
    ) as { up_id: string };
    const user = await prisma.user.findUnique({
      where: { up_id: decoded.up_id },
    });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    const params = context.params;
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการอัปเดต" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: id },
      select: {
        equipment_id: true,
        serialNumber: true,
        name: true,
        category: true,
        status: true,
        unit: true,
        description: true,
        owner: {
          select: {
            displayName: true,
            prefix: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
    if (!equipment) {
      return NextResponse.json(
        { error: "ไม่พบรายการของ" },
        { status: 404 }
      );
    }

    const formattedEquipment = {
      id: equipment.equipment_id,
      code: equipment.serialNumber,
      name: equipment.name,
      unit: equipment.unit,
      category: equipment.category,
      status: equipment.status,
      description: equipment.description,
      owner:
        equipment.owner.displayName ||
        `${equipment.owner.prefix || ""} ${equipment.owner.first_name || ""} ${equipment.owner.last_name || ""}`.trim() ||
        "ไม่ระบุเจ้าของ",
    };

    return NextResponse.json(formattedEquipment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const token =
      req.headers.get("authorization")?.split(" ")[1] ||
      req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "ต้องมีการตรวจสอบสิทธิ์" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret"
    ) as { up_id: string };
    const user = await prisma.user.findUnique({
      where: { up_id: decoded.up_id },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    const params = context.params;
    const id = Number(params.id);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();

    const updatedEquipment = await prisma.equipment.update({
      where: { equipment_id: id },
      data: {
        name: body.name,
        category: body.category,
        status: body.status,
        unit: body.unit,
      },
    });

    return NextResponse.json(updatedEquipment);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "เลข Serial Number ซ้ำ กรุณาใช้เลขใหม่" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดต" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const params = context.params;
    const id = Number(params.id);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: id },
    });
    if (!equipment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.equipment.delete({
      where: { equipment_id: id },
    });

    return NextResponse.json({ message: "ลบอุปกรณ์สำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  }
}