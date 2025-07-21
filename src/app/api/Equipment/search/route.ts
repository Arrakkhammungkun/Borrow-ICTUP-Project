"use server"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get("name");
        const serialNumber = searchParams.get("serialNumber");
        const category = searchParams.get("category");
        const status = searchParams.get("status");

        const filters: Prisma.EquipmentWhereInput = {};

        if (name) {
            filters.name = { contains: name, mode: "insensitive" };
        }
        if (serialNumber) {
            filters.serialNumber = { contains: serialNumber, mode: "insensitive" };
        }
        if (category) {
            filters.category = { equals: category };
        }
        if (status) {
            if (!["AVAILABLE", "UNAVAILABLE"].includes(status)) {
                return NextResponse.json({ success: false, error: "สถานะไม่ถูกต้อง ต้องเป็น AVAILABLE หรือ UNAVAILABLE" }, { status: 400 });
            }
            filters.status = { equals: status as "AVAILABLE" | "UNAVAILABLE" };
        }

        const equipmentItems = await prisma.equipment.findMany({
            where: filters,
        });

        if (equipmentItems.length === 0) {
            return NextResponse.json({ success: true, data: [], message: "ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข" }, { status: 200 });
        }

        return NextResponse.json({ success: true, data: equipmentItems }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการค้นหา" }, { status: 500 });
    }
}