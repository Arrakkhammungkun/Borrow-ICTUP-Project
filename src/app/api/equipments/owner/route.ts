import { NextResponse,NextRequest } from 'next/server';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';

// API นี้ fetch equipments ที่เจ้าของเป็นผู้ใช้ปัจจุบัน โดยดึงจาก token.
export async function GET(req:NextRequest) {
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

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'; 
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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // สร้างเงื่อนไข where สำหรับการค้นหา
    const whereClause: any = {
      ownerId: user.id,
    };

    if (search) {
      whereClause.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
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
        feature: true,
        brokenQuantity:true ,
        lostQuantity: true,
        inUseQuantity:true,
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


    const formattedEquipments = equipments.map((e) => {
      let status = '';
      if (e.status === 'AVAILABLE') {
        if (e.total === 0) {
          status = 'งดการยืม';
        } else if (e.availableQuantity === e.total) {
          status = 'ยืมได้';
        } else if (e.inUseQuantity === e.total) {
          status = 'อยู่ระหว่างยืม';
        } else if (e.brokenQuantity + e.lostQuantity === e.total) {
          status = 'งดการยืม';
        } else {
          status = 'ยืมได้';
        }
      } else {
     
        status = 'เลิกใช้งาน';
      }

      return {
        id: e.equipment_id,
        code: e.serialNumber,
        name: e.name,
        category: e.category,
        status: status,
        location: e.storageLocation,
        all: e.total,
        used: e.inUseQuantity,
        available: e.availableQuantity,
        broken: e.brokenQuantity, 
        lost: e.lostQuantity, 
        unit: e.unit,
        description:e.description,
      };
    });

    return NextResponse.json(formattedEquipments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}