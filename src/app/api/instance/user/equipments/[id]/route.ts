
"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const equipmentId = parseInt(id, 10);
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: "ID อุปกรณ์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const token = req.cookies.get("auth_token")?.value;
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

    const user = await prisma.user.findUnique({
      where: { up_id: decoded.up_id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: {
        equipment_id: equipmentId,
        status: "AVAILABLE",
      },
      select: {
        equipment_id: true,
        serialNumber: true,
        name: true,
        category: true,
        description: true,
        total: true,
        availableQuantity: true,
        status: true,
        unit: true,
        storageLocation: true,
        feature: true,
        brokenQuantity: true,
        lostQuantity: true,
        inUseQuantity: true,
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
            where: {
              status: "AVAILABLE", 
            },
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

    if (!equipment) {
      return NextResponse.json(
        { error: "ไม่พบอุปกรณ์" },
        { status: 404 }
      );
    }

    const formattedEquipment = {
      id: equipment.equipment_id,
      code: equipment.serialNumber || "-",
      name: equipment.name,
      category: equipment.category,
      owner: `${equipment.owner.prefix || ""} ${equipment.owner.first_name || ""} ${equipment.owner.last_name || ""} `,
      status:
        equipment.status === "AVAILABLE"
          ? equipment.total === 0 || equipment.brokenQuantity + equipment.lostQuantity === equipment.total
            ? "งดการยืม"
            : equipment.availableQuantity === equipment.total
            ? "ยืมได้"
            : equipment.inUseQuantity === equipment.total
            ? "อยู่ระหว่างยืม"
            : "ยืมได้"
          : "เลิกใช้งาน",
      location: equipment.storageLocation || "-",
      all: equipment.total,
      available: equipment.availableQuantity,
      broken: equipment.brokenQuantity,
      lost: equipment.lostQuantity,
      unit: equipment.unit,
      description: equipment.description || "-",
      isIndividual: equipment.isIndividual,
      instances: equipment.isIndividual
        ? equipment.instances.map((instance) => ({
            id: instance.id,
            serialNumber: instance.serialNumber,
            status: instance.status,
            location: instance.location || "-",
            note: instance.note || "-",
          }))
        : [],
    };

    return NextResponse.json(formattedEquipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
