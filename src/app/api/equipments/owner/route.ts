import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';

// API นี้ fetch equipments ที่เจ้าของเป็นผู้ใช้ปัจจุบัน โดยดึงจาก token.
export async function GET(req: Request) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    console.log("token", token);
    if (!token) {
      console.error("API: No token provided in Authorization header.");
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'; // แนะนำเก็บใน .env
    const decoded = jwt.verify(token, jwtSecret) as { up_id: string };
    if (!decoded.up_id) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    // หา user จาก up_id เพื่อได้ id (Int)
    const user = await prisma.user.findUnique({
      where: {
        up_id: decoded.up_id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const equipments = await prisma.equipment.findMany({
      where: {
        ownerId: user.id,
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
        state: true,
        feature: true,
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

    // Format ข้อมูลให้ตรงกับรูปแบบที่ frontend ใช้
    const formattedEquipments = equipments.map((e) => {
      let status = '';
      if (e.status === 'AVAILABLE') {
        if (e.availableQuantity === e.total) {
          status = 'ยืมได้';
        } else {
          status = 'อยู่ระหว่างยืม';
        }
      } else {
        if (e.availableQuantity === 0) {
          status = 'เลิกใช้งาน';
        } else {
          status = 'งดการยืม';
        }
      }

      return {
        id: e.equipment_id,
        code: e.serialNumber,
        name: e.name,
        category: e.category,
        status: status,
        location: e.storageLocation,
        all: e.total,
        used: e.total - e.availableQuantity,
        available: e.availableQuantity,
        broken: 0, // สามารถปรับถ้ามี field จริงในอนาคต
        lost: 0, // สามารถปรับถ้ามี field จริงในอนาคต
        unit: e.unit,
      };
    });

    return NextResponse.json(formattedEquipments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}