import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

//API นี้ fetch all equipments (ไม่มี search param) เพราะเราจะ filter ที่ client-side เพื่อ responsiveness (เหมือน mockData). ถ้าข้อมูลเยอะในอนาคต, ค่อยเพิ่ม search param และ query WHERE ใน Prisma.
export async function GET() {
  try {
    const equipments = await prisma.equipment.findMany({
      include: { owner: true }, // Include owner เพื่อดึงชื่อเจ้าของ
    });

    // Format ข้อมูลให้ตรงกับรูปแบบที่ frontend ใช้ (เหมือน mockData)
    const formattedEquipments = equipments.map((e) => ({
      id: e.equipment_id,
      code: e.serialNumber,
      name: e.name,
      owner: e.owner.displayName || `${e.owner.prefix || ''} ${e.owner.first_name || ''} ${e.owner.last_name || ''}`.trim() || 'ไม่ระบุเจ้าของ',
      quantity: e.total, // หรือใช้ e.availableQuantity ถ้าต้องการแสดงจำนวนที่พร้อมยืม
    }));

    return NextResponse.json(formattedEquipments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}