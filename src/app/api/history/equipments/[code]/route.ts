import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db'; // สมมติว่าคุณมี lib/db.ts สำหรับ Prisma client
import jwt from 'jsonwebtoken';

export async function GET(
  req: NextRequest,
  context: any
) {
  const params = context.params;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  try {
    // ✅ เช็ค JWT
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { up_id: string };

    if (!decoded.up_id) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    // ✅ หา user id จาก up_id
    const user = await prisma.user.findUnique({
      where: { up_id: decoded.up_id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // ✅ หาอุปกรณ์ตาม serialNumber และ check owner
    const equipment = await prisma.equipment.findUnique({
      where: { serialNumber: code },
      select: { equipment_id: true, ownerId: true },
    });

    if (!equipment || equipment.ownerId !== user.id) {
      return NextResponse.json({ error: "ไม่พบอุปกรณ์หรือไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    // ✅ ดึง BorrowingDetail ของอุปกรณ์นี้
    const details = await prisma.borrowingDetail.findMany({
      where: { equipmentId: equipment.equipment_id },
      include: {
        borrowing: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // เรียงจากใหม่ไปเก่า
    });

    // ✅ แปลงข้อมูลเป็น History
    const history = details.map((detail) => {
      const borrowing = detail.borrowing;
      const borrower = borrowing.borrower;

      // ✅ สร้างชื่อผู้ยืม
      const name =
        borrower.displayName ||
        `${borrower.prefix || ''}${borrower.first_name || ''} ${borrower.last_name || ''}`.trim();

      // ✅ แปลงสถานะ
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
      };
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching equipment history:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}
