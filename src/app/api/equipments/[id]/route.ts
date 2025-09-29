import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
//สำหรับ ดึงอุปกรณ์รายเดี่ยว ของหน้าผู้ยืม 
export async function GET(req: NextRequest,{ params }: { params: { id: string } }) {
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
        total: true,
        availableQuantity: true,
        storageLocation: true,
        brokenQuantity: true,
        lostQuantity: true,
        description: true,
        isIndividual: true,
        owner: {
          select: {
            displayName: true,
            prefix: true,
            first_name: true,
            last_name: true,
          },
        },
        instances: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            location: true,
            note: true,
          },
        },
      },
    });
    
    if (!equipment || equipment.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Not found or unavailable" },
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
      location: equipment.storageLocation,
      available: equipment.availableQuantity,
      brokenQuantity: equipment.brokenQuantity,
      lostQuantity: equipment.lostQuantity,
      description: equipment.description,
      owner:
        equipment.owner.displayName ||
        `${equipment.owner.prefix || ""} ${equipment.owner.first_name || ""} ${equipment.owner.last_name || ""}`.trim() ||
        "ไม่ระบุเจ้าของ",
      quantity: equipment.total,
      instances: equipment.instances.map((instance) => ({
        id: instance.id,
        serialNumber: instance.serialNumber,
        status: instance.status,
        location: instance.location || "-",
        note: instance.note || "-",
      })),
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const id = Number(params.id);
        if (isNaN(id)) {
          return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
        }

    // ดึงข้อมูลเดิม
    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: id },
      select: {
        total: true,
        availableQuantity: true,
        brokenQuantity: true,
        lostQuantity: true,
        inUseQuantity: true,
      },
    });

    if (!equipment)
      return NextResponse.json({ error: "ไม่พบอุปกรณ์" }, { status: 404 });

    const body = await req.json();

    // ค่าใหม่ที่รับมาจาก frontend
    const newTotal = body.total;
    const newBroken = body.brokenQuantity ?? equipment.brokenQuantity;
    const newLost = body.lostQuantity ?? equipment.lostQuantity;

    // ตรวจสอบ balance: total ต้อง >= broken + lost + inUse
    const mustRemain = newBroken + newLost + equipment.inUseQuantity;
    if (newTotal < mustRemain) {
      return NextResponse.json(
        {
          error: "จำนวนรวมต้องไม่น้อยกว่าผลรวมของ (ชำรุด + สูญหาย + ที่ถูกยืม)",
        },
        { status: 400 }
      );
    }

    // คำนวณ available ใหม่ = total - (inUse + broken + lost)
    const newAvailable =
      newTotal - (equipment.inUseQuantity + newBroken + newLost);

    const updatedEquipment = await prisma.equipment.update({
      where: { equipment_id: id },
      data: {
        serialNumber: body.serialNumber,
        name: body.name,
        category: body.category,
        status: body.status,
        unit: body.unit,
        total: newTotal,
        storageLocation: body.storageLocation,
        availableQuantity: newAvailable,
        brokenQuantity: newBroken,
        lostQuantity: newLost,
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // ดึงข้อมูลเพื่อเช็คว่ามีอยู่ไหม
    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: id },
    });
    if (!equipment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ลบอุปกรณ์
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
