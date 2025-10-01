"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import { EquipmentStatus, ApprovalStatus } from "@prisma/client";

const jwtSecret = process.env.JWT_SECRET!;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; instanceId: string }> }
) {
  try {
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

    // Await params to resolve the Promise
    const { id, instanceId } = await params;
    const equipmentId = parseInt(id);
    const instanceIdNum = parseInt(instanceId);

    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: equipmentId },
      include: { instances: true },
    });

    if (!equipment || !equipment.isIndividual) {
      return NextResponse.json(
        { success: false, message: "Equipment not found or not individual" },
        { status: 400 }
      );
    }

    const instance = await prisma.equipmentInstance.findUnique({
      where: { id: instanceIdNum },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, message: "Instance not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { serialNumber, status, location, note } = body;

    if (!serialNumber || !status) {
      return NextResponse.json(
        { success: false, message: "ต้องระบุ serialNumber และ status" },
        { status: 400 }
      );
    }

    // Check for duplicate serialNumber
    if (serialNumber !== instance.serialNumber) {
      const existingInstance = await prisma.equipmentInstance.findUnique({
        where: { serialNumber },
      });
      if (existingInstance) {
        return NextResponse.json(
          { success: false, message: "เลข Serial Number นี้ถูกใช้งานแล้ว" },
          { status: 400 }
        );
      }
    }

    // Calculate changes to equipment quantities based on status change
    const updates: any = {};
    if (status !== instance.status) {
      if (instance.status === "AVAILABLE") {
        updates.availableQuantity = { decrement: 1 };
      } else if (instance.status === "IN_USE") {
        updates.inUseQuantity = { decrement: 1 };
      } else if (instance.status === "BROKEN") {
        updates.brokenQuantity = { decrement: 1 };
      } else if (instance.status === "LOST") {
        updates.lostQuantity = { decrement: 1 };
      }

      if (status === "AVAILABLE") {
        updates.availableQuantity = { increment: 1 };
      } else if (status === "IN_USE") {
        updates.inUseQuantity = { increment: 1 };
      } else if (status === "BROKEN") {
        updates.brokenQuantity = { increment: 1 };
      } else if (status === "LOST") {
        updates.lostQuantity = { increment: 1 };
      }
    }

    // Perform updates in a transaction
    const updatedEquipment = await prisma.$transaction(async (tx) => {
      // Update the instance
      await tx.equipmentInstance.update({
        where: { id: instanceIdNum },
        data: {
          serialNumber,
          status: status as EquipmentStatus,
          location: location || null,
          note: note || null,
        },
      });

      // Update equipment quantities
      if (Object.keys(updates).length > 0) {
        await tx.equipment.update({
          where: { equipment_id: equipmentId },
          data: updates,
        });
      }

      // Fetch updated equipment with instances
      return tx.equipment.findUnique({
        where: { equipment_id: equipmentId },
        include: { instances: true },
      });
    });

    return NextResponse.json(
      { success: true, data: updatedEquipment },
      { status: 200 }
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
        error: "เกิดข้อผิดพลาดในการอัปเดต",
        message: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; instanceId: string }> }
) {
  try {
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

    // Await params to resolve the Promise
    const { id, instanceId } = await params;
    const equipmentId = parseInt(id);
    const instanceIdNum = parseInt(instanceId);

    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: equipmentId },
      include: { instances: true },
    });

    if (!equipment || !equipment.isIndividual) {
      return NextResponse.json(
        { success: false, message: "Equipment not found or not individual" },
        { status: 400 }
      );
    }

    const instance = await prisma.equipmentInstance.findUnique({
      where: { id: instanceIdNum },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, message: "Instance not found" },
        { status: 404 }
      );
    }

    // Check if instance is linked to active borrowing
    const activeBorrowing = await prisma.borrowingDetail.findFirst({
      where: {
        equipmentInstanceId: instanceIdNum,
        approvalStatus: {
          in: [ApprovalStatus.PENDING, ApprovalStatus.APPROVED],
        },
      },
    });

    if (activeBorrowing) {
      return NextResponse.json(
        { success: false, message: "ไม่สามารถลบได้ เนื่องจากอุปกรณ์นี้ถูกยืมอยู่" },
        { status: 400 }
      );
    }

    // Calculate changes to equipment quantities based on instance status
    const updates: any = {
      total: { decrement: 1 },
    };
    if (instance.status === "AVAILABLE") {
      updates.availableQuantity = { decrement: 1 };
    } else if (instance.status === "IN_USE") {
      updates.inUseQuantity = { decrement: 1 };
    } else if (instance.status === "BROKEN") {
      updates.brokenQuantity = { decrement: 1 };
    } else if (instance.status === "LOST") {
      updates.lostQuantity = { decrement: 1 };
    }

    // Perform deletion and updates in a transaction
    const updatedEquipment = await prisma.$transaction(async (tx) => {
      // Delete the instance
      await tx.equipmentInstance.delete({
        where: { id: instanceIdNum },
      });

      // Update equipment quantities
      await tx.equipment.update({
        where: { equipment_id: equipmentId },
        data: updates,
      });

      // Fetch updated equipment with instances
      return tx.equipment.findUnique({
        where: { equipment_id: equipmentId },
        include: { instances: true },
      });
    });

    return NextResponse.json(
      { success: true, data: updatedEquipment },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดในการลบ",
        message: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      },
      { status: 500 }
    );
  }
}