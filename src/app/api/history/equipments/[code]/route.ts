// /api/history/equipments/[code]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest, context:{ params: Promise<{ code: string | string[] }> }) {
  const params = await context.params;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  try {
    // ตรวจสอบ Authentication
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { up_id: string };

    if (!decoded.up_id) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 });
    }

    // ค้นหาผู้ใช้
    const user = await prisma.user.findUnique({
      where: { up_id: decoded.up_id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // ค้นหาอุปกรณ์ (รองรับทั้ง ID และ serialNumber)
    let equipment;
    
    // ลองแปลงเป็นตัวเลข ถ้าได้แสดงว่าส่ง ID มา
    const numericId = parseInt(code);
    
    if (!isNaN(numericId)) {
      // ค้นหาด้วย equipment_id
      equipment = await prisma.equipment.findFirst({
        where: { 
          equipment_id: numericId,
          ownerId: user.id
        },
        select: { 
          equipment_id: true,
          name: true,
          serialNumber: true,
          category: true,
          description: true,
          total: true,
          availableQuantity: true,
          brokenQuantity: true,
          lostQuantity: true,
          inUseQuantity: true,
          status: true,
          unit: true,
          storageLocation: true,
          ownerId: true,
          isIndividual: true
        },
      });
    } else {
      // ค้นหาด้วย serialNumber
      equipment = await prisma.equipment.findFirst({
        where: { 
          serialNumber: code,
          ownerId: user.id
        },
        select: { 
          equipment_id: true,
          name: true,
          serialNumber: true,
          category: true,
          description: true,
          total: true,
          availableQuantity: true,
          brokenQuantity: true,
          lostQuantity: true,
          inUseQuantity: true,
          status: true,
          unit: true,
          storageLocation: true,
          ownerId: true,
          isIndividual: true
        },
      });
    }

    if (!equipment) {
      return NextResponse.json({ 
        error: 'ไม่พบอุปกรณ์หรือไม่มีสิทธิ์เข้าถึง',
        debug: {
          searchedCode: code,
          isNumeric: !isNaN(numericId),
          userId: user.id
        }
      }, { status: 403 });
    }

    // ค้นหา BorrowingDetail พร้อมข้อมูล EquipmentInstance และ ReturnHistory
    const details = await prisma.borrowingDetail.findMany({
      where: { equipmentId: equipment.equipment_id },
      include: {
        borrowing: {
          include: {
            borrower: true,
          },
        },
        equipmentInstance: true,
        returnHistories: {
          orderBy: { returnedAt: 'desc' },
          include: {
            equipmentInstance: {   // 👈 join มาด้วย
              select: {
                serialNumber: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // แปลงข้อมูลเป็นผลลัพธ์
    const history = details.map((detail) => {
      const borrowing = detail.borrowing;
      const borrower = borrowing.borrower;

      // ชื่อผู้ยืม
      const name =
        borrower.displayName ||
        `${borrower.prefix || ''}${borrower.first_name || ''} ${borrower.last_name || ''}`.trim();

      // แปลงสถานะเป็นภาษาไทยและกำหนดสี
      let statusThai: string = borrowing.status;
      let statusColor: string = 'bg-gray-200 text-gray-800';

      switch (borrowing.status) {
        case 'PENDING':
          statusThai = 'รออนุมัติ';
          statusColor = 'bg-yellow-200 text-yellow-800';
          break;
        case 'APPROVED':
          statusThai = 'อนุมัติแล้ว';
          statusColor = 'bg-[#2ECC71] text-[#fff]';
          break;
        case 'REJECTED':
          statusThai = 'ปฏิเสธ';
          statusColor = 'bg-[#FFC9C9] text-[#B83A42]';
          break;
        case 'BORROWED':
          statusThai = 'อยู่ระหว่างยืม';
          statusColor = 'bg-[#FFF085] text-[#BF963C]';
          break;
        case 'RETURNED':
          statusThai = 'รับคืนแล้ว';
          statusColor = borrowing.returnStatusColor === 'green'
            ? 'bg-green-500 text-white'
            : borrowing.returnStatusColor === 'yellow'
            ? 'bg-yellow-500 text-white'
            : 'bg-red-500 text-white';
          break;
        case 'OVERDUE':
          statusThai = 'เลยกำหนด';
          statusColor = 'bg-orange-200 text-orange-800';
          break;
        default:
          statusThai = borrowing.status;
      }

      // ข้อมูลประวัติของแต่ละชิ้น (EquipmentInstance)
      const equipmentInstance = detail.equipmentInstance
        ? {
            serialNumber: detail.equipmentInstance.serialNumber,
            status: detail.equipmentInstance.status,
            note: detail.equipmentInstance.note || '',
          }
        : null;

      // ข้อมูลประวัติการคืน (ReturnHistory)
      const returnHistories = detail.returnHistories.map((history) => ({
        condition: history.condition || 'ไม่ระบุ',
        note: history.note || '',
        returnedAt: history.returnedAt.toISOString(),
        equipmentInstanceId: history.equipmentInstanceId || null,
        serialNumber: history.equipmentInstance?.serialNumber || null, 
      }));

      return {
        id: borrowing.id,
        name,
        borrowDate: borrowing.requestedStartDate ? borrowing.requestedStartDate.toISOString() : null,
        dueDate: borrowing.dueDate ? borrowing.dueDate.toISOString() : null,
        returnDate: borrowing.returnedDate ? borrowing.returnedDate.toISOString() : null,
        quantity: detail.quantityBorrowed,
        place: borrowing.location || '',
        status: statusThai,
        statusColor,
        returnStatusColor: borrowing.returnStatusColor,
        equipmentInstance,
        returnHistories,
        overallReturnNote: borrowing.returnNote || ''
      };
    });

    // แปลงสถานะอุปกรณ์เป็นภาษาไทย
    let statusThai = 'ไม่พร้อมใช้งาน';
    if (equipment.status === 'AVAILABLE') {
      statusThai = 'ยืมได้';
    } else if (equipment.status === 'IN_USE') {
      statusThai = 'อยู่ระหว่างยืม';
    } else if (equipment.status === 'UNAVAILABLE') {
      statusThai = 'ไม่พร้อมใช้งาน';
    }

    // ส่งข้อมูลอุปกรณ์และประวัติกลับไป
    return NextResponse.json({
      equipment: {
        id: equipment.equipment_id,
        code: equipment.serialNumber || equipment.equipment_id.toString(),
        name: equipment.name,
        category: equipment.category,
        description: equipment.description,
        status: statusThai,
        location: equipment.storageLocation,
        unit: equipment.unit,
        all: equipment.total,
        available: equipment.availableQuantity,
        used: equipment.inUseQuantity,
        broken: equipment.brokenQuantity,
        lost: equipment.lostQuantity,
        isIndividual: equipment.isIndividual
      },
      history
    });
  } catch (error: any) {
    console.error('Error fetching equipment history:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      details: error.message 
    }, { status: 500 });
  }
}