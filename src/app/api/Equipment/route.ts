"use server"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
    try {
        const equipmentItems = await prisma.equipment.findMany();
        return NextResponse.json({ success: true, data: equipmentItems }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
    }
}