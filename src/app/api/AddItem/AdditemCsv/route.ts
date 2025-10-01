"use server";

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
import jwt from "jsonwebtoken";
import { EquipmentStatus } from "@prisma/client";

const jwtSecret = process.env.JWT_SECRET!;

interface CSVRow {
  equipmentCode: string;
  equipmentName: string;
  category: string;
  description: string;
  unit: string;
  serialNumber: string;
  status: string;
  location: string;
  note: string;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 1) return [];

  // Assume headers: equipmentCode,equipmentName,category,description,unit,serialNumber,status,location,note
  const expectedHeaders = [
    "equipmentCode",
    "equipmentName",
    "category",
    "description",
    "unit",
    "serialNumber",
    "status",
    "location",
    "note",
  ];
  const headers = lines[0].split(",").map((h) => h.trim());

  if (headers.length !== expectedHeaders.length) {
    throw new Error("รูปแบบหัวข้อ CSV ไม่ตรงตามที่กำหนด");
  }

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length !== headers.length) continue; // Skip invalid rows

    const row: any = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row as CSVRow);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "ไม่ได้ส่ง token มาด้วย" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as { up_id: string };
    } catch (jwtErr: any) {
      return NextResponse.json(
        { success: false, message: `ข้อผิดพลาด JWT: ${jwtErr.message}` },
        { status: 401 }
      );
    }

    if (!decoded.up_id) {
      return NextResponse.json({ success: false, message: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { up_id: decoded.up_id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ไม่พบผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "ไม่มีไฟล์ CSV ในคำขอ" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่มีข้อมูลใน CSV" },
        { status: 400 }
      );
    }

    // Collect all serialNumbers to check duplicates in one query
    const allSerialNumbers = rows.map((row) => row.serialNumber);
    const existingInstances = await prisma.equipmentInstance.findMany({
      where: { serialNumber: { in: allSerialNumbers } },
      select: { serialNumber: true },
    });
    const existingSerialSet = new Set(existingInstances.map((inst) => inst.serialNumber));

    // Group rows by equipmentCode
    const groups = new Map<string, CSVRow[]>();
    for (const row of rows) {
      if (!groups.has(row.equipmentCode)) {
        groups.set(row.equipmentCode, []);
      }
      groups.get(row.equipmentCode)!.push(row);
    }

    const errors: string[] = [];
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [equipmentCode, group] of groups.entries()) {
      if (group.length === 0) continue;

      const first = group[0];

      let equipment = await prisma.equipment.findUnique({
        where: { serialNumber: equipmentCode },
      });

      let equipmentId: number;

      if (!equipment) {
        equipment = await prisma.equipment.create({
          data: {
            name: first.equipmentName,
            serialNumber: equipmentCode,
            category: first.category,
            description: first.description || "",
            total: 0,
            availableQuantity: 0,
            brokenQuantity: 0,
            lostQuantity: 0,
            inUseQuantity: 0,
            status: "AVAILABLE",
            unit: first.unit,
            storageLocation: first.location || "Default",
            ownerId: user.id,
            feature: "",
            isIndividual: true,
          },
        });
      } else if (!equipment.isIndividual) {
        errors.push(`อุปกรณ์รหัส ${equipmentCode} ไม่ใช่ประเภทรายชิ้น`);
        continue;
      }

      equipmentId = equipment.equipment_id;

      const instancesToCreate: {
        equipmentId: number;
        serialNumber: string;
        status: EquipmentStatus;
        location: string | null;
        note: string | null;
      }[] = [];

      for (const row of group) {
        if (existingSerialSet.has(row.serialNumber)) {
          totalSkipped++;
          continue; // Skip without adding to errors
        }

        if (!Object.values(EquipmentStatus).includes(row.status as EquipmentStatus)) {
          errors.push(`สถานะไม่ถูกต้อง "${row.status}" สำหรับ serialNumber ${row.serialNumber} ใน equipmentCode ${row.equipmentCode}`);
          continue;
        }

        instancesToCreate.push({
          equipmentId,
          serialNumber: row.serialNumber,
          status: row.status as EquipmentStatus,
          location: row.location || null,
          note: row.note || null,
        });
      }

      if (instancesToCreate.length > 0) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.equipmentInstance.createMany({ data: instancesToCreate });

            const equipmentIdFilter = { equipmentId };

            const total = await tx.equipmentInstance.count({ where: equipmentIdFilter });
            const available = await tx.equipmentInstance.count({
              where: { ...equipmentIdFilter, status: EquipmentStatus.AVAILABLE },
            });
            const inUse = await tx.equipmentInstance.count({
              where: { ...equipmentIdFilter, status: EquipmentStatus.IN_USE },
            });
            const broken = await tx.equipmentInstance.count({
              where: { ...equipmentIdFilter, status: EquipmentStatus.BROKEN },
            });
            const lost = await tx.equipmentInstance.count({
              where: { ...equipmentIdFilter, status: EquipmentStatus.LOST },
            });

            await tx.equipment.update({
              where: { equipment_id: equipmentId },
              data: {
                total,
                availableQuantity: available,
                inUseQuantity: inUse,
                brokenQuantity: broken,
                lostQuantity: lost,
                status: available > 0 ? EquipmentStatus.AVAILABLE : EquipmentStatus.UNAVAILABLE,
              },
            });
          });

          totalInserted += instancesToCreate.length;
        } catch (txErr: any) {
          console.error(txErr);
          errors.push(`เกิดข้อผิดพลาดในการบันทึกสำหรับ equipmentCode ${equipmentCode}: ${txErr.message}`);
        }
      }
    }

    let message: string;
    if (errors.length === 0) {
      message = `นำเข้าสำเร็จ ${totalInserted} รายการใหม่ (ข้าม ${totalSkipped} รายการที่ซ้ำ)`;
    } else {
      message = `นำเข้าได้บางส่วน ${totalInserted} รายการใหม่ (ข้าม ${totalSkipped} รายการที่ซ้ำ) มีข้อผิดพลาด ${errors.length} รายการ`;
    }

    const success = errors.length === 0 && totalInserted > 0;

    return NextResponse.json(
      { success, message, errors },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "มี serialNumber ซ้ำกันในฐานข้อมูล (อาจเกิดจากข้อมูลใน CSV ซ้ำกันเอง)" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" },
      { status: 500 }
    );
  }
}