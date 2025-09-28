"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import { EquipmentStatus } from "@prisma/client";

const jwtSecret = process.env.JWT_SECRET!;


interface EquipmentInstanceInput {
  equipmentId: number;
  serialNumber: string;
  status: EquipmentStatus; 
  location?: string | null; 
  note?: string | null; 
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required.", message: "ไม่ได้ส่ง token มาด้วย" },
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
      where: { up_id: decoded.up_id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้", message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    const equipmentId = parseInt(params.id);
    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: equipmentId },
    });

    if (!equipment || !equipment.isIndividual) {
      return NextResponse.json(
        { success: false, message: "Equipment not found or not individual" },
        { status: 400 }
      );
    }

    const { mode, quantity, serialPrefix, serialNumber, location } = body;

    if (!mode || (mode !== "auto" && mode !== "manual")) {
      return NextResponse.json(
        { success: false, message: "โหมดไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (mode === "auto") {
      if (!quantity || quantity <= 0 || !serialPrefix) {
        return NextResponse.json(
          {
            success: false,
            message: "ต้องระบุ quantity และ serialPrefix สำหรับโหมด auto",
          },
          { status: 400 }
        );
      }

      const existingCount = await prisma.equipmentInstance.count({
        where: { equipmentId },
      });
      const instances: EquipmentInstanceInput[] = [];
      for (let i = 1; i <= quantity; i++) {
        instances.push({
          equipmentId,
          serialNumber: `${serialPrefix}${String(existingCount + i).padStart(3, "0")}`,
          status: EquipmentStatus.AVAILABLE, // Use enum value
          location: location || null,
          note: "",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.equipmentInstance.createMany({ data: instances });
        const total = await tx.equipmentInstance.count({
          where: { equipmentId },
        });
        const availableQuantity = await tx.equipmentInstance.count({
          where: { equipmentId, status: EquipmentStatus.AVAILABLE },
        });
        await tx.equipment.update({
          where: { equipment_id: equipmentId },
          data: { total, availableQuantity },
        });
      });
    } else {
      // manual
      if (!serialNumber) {
        return NextResponse.json(
          { success: false, message: "ต้องระบุ serialNumber สำหรับโหมด manual" },
          { status: 400 }
        );
      }

      // Check for duplicate serialNumber
      const existingInstance = await prisma.equipmentInstance.findUnique({
        where: { serialNumber },
      });
      if (existingInstance) {
        return NextResponse.json(
          { success: false, message: "เลข Serial Number นี้ถูกใช้งานแล้ว" },
          { status: 400 }
        );
      }

      const instance: EquipmentInstanceInput = {
        equipmentId,
        serialNumber,
        status: EquipmentStatus.AVAILABLE, // Use enum value
        location: location || null,
        note: "",
      };

      await prisma.$transaction(async (tx) => {
        await tx.equipmentInstance.create({ data: instance });
        const total = await tx.equipmentInstance.count({
          where: { equipmentId },
        });
        const availableQuantity = await tx.equipmentInstance.count({
          where: { equipmentId, status: EquipmentStatus.AVAILABLE },
        });
        await tx.equipment.update({
          where: { equipment_id: equipmentId },
          data: { total, availableQuantity },
        });
      });
    }

    const updatedEquipment = await prisma.equipment.findUnique({
      where: { equipment_id: equipmentId },
      include: { instances: true },
    });

    return NextResponse.json(
      { success: true, data: updatedEquipment },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "เลข Serial Number นี้ถูกใช้งานแล้ว" },
        { status: 400 }
      );
    }
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