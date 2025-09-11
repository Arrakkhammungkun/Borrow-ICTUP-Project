"use server"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: Request, context: any) {
    const params = context.params;
    try {
        const equipmentId = parseInt(params.id);
        if (isNaN(equipmentId)) {
            return NextResponse.json({ success: false, error: "รหัสอุปกรณ์ไม่ถูกต้อง" }, { status: 400 });
        }

        const equipment = await prisma.equipment.findUnique({
            where: { equipment_id: equipmentId },
        });

        if (!equipment) {
            return NextResponse.json({ success: false, error: "ไม่พบอุปกรณ์ที่มีรหัสนี้" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: equipment }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
    }
}