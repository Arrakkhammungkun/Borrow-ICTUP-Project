import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const borrowingId = parseInt(id);
  if (isNaN(borrowingId)) {
    return NextResponse.json({ error: 'Invalid borrowing ID' }, { status: 400 });
  }

  // Verify token จาก cookie
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userUpId = decoded.up_id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // หา borrowing และ check สิทธิ์ + status
      const borrowing = await tx.borrowing.findUnique({
        where: { id: borrowingId },
        include: {
          details: {
            include: { equipmentInstance: true }, // รวม equipmentInstance เพื่อดึงข้อมูล
          },
          borrower: true,
        },
      });

      if (!borrowing) {
        throw new Error('Borrowing not found');
      }

      console.log('Borrowing borrowerId:', borrowing.borrowerId);
      console.log('User up_id from token:', userUpId);

      // ตรวจสอบว่า user เป็น borrower หรือมีสิทธิ์ (เช่น admin)
      if (borrowing.borrower.up_id !== userUpId) {
        throw new Error('Not authorized to delete this borrowing');
      }
      if (borrowing.status !== 'PENDING') {
        throw new Error('Can only delete pending borrowings');
      }

      // อัปเดตสถานะ EquipmentInstance และจำนวนใน Equipment
      for (const detail of borrowing.details) {
        if (!detail.equipmentInstanceId) {
          throw new Error(`BorrowingDetail ${detail.id} has no equipmentInstanceId`);
        }

        // คืนสถานะ EquipmentInstance เป็น AVAILABLE
        await tx.equipmentInstance.update({
          where: { id: detail.equipmentInstanceId },
          data: { status: 'AVAILABLE' },
        });

        // อัปเดตจำนวนใน Equipment
        await tx.equipment.update({
          where: { equipment_id: detail.equipmentId },
          data: {
            availableQuantity: { increment: detail.quantityBorrowed },
            inUseQuantity: { decrement: detail.quantityBorrowed },
          },
        });
      }

      // ลบ BorrowingDetail
      await tx.borrowingDetail.deleteMany({
        where: { borrowingId },
      });

      // ลบ Borrowing
      await tx.borrowing.delete({
        where: { id: borrowingId },
      });

      return { message: 'Borrowing deleted successfully' };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Delete error:', error);
    let status = 500;
    let message = 'Failed to delete borrowing';
    if (error.message === 'Borrowing not found') {
      status = 404;
      message = 'Borrowing not found';
    } else if (error.message === 'Not authorized to delete this borrowing') {
      status = 403;
      message = 'คุณไม่มีสิทธิ์ลบรายการยืมนี้';
    } else if (error.message === 'Can only delete pending borrowings') {
      status = 400;
      message = 'ลบได้เฉพาะรายการยืมที่รออนุมัติเท่านั้น';
    } else if (error.message.includes('has no equipmentInstanceId')) {
      status = 400;
      message = 'ข้อมูล BorrowingDetail ไม่สมบูรณ์';
    }
    return NextResponse.json({ error: message }, { status });
  } finally {
    await prisma.$disconnect();
  }
}