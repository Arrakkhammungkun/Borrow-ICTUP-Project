import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  // ตรวจสอบ token
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
  const user = await prisma.user.findUnique({ where: { up_id: userUpId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const userId = user.id;

  try {
    const { status } = await req.json();
    if (!status || status !== 'BORROWED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // อัปเดตสถานะของ Borrowing และ BorrowingDetail ใน transaction
    const updatedBorrowings = await prisma.$transaction(async (tx) => {
      // อัปเดตสถานะ Borrowing
      const updateResult = await tx.borrowing.updateMany({
        where: {
          borrowerId: userId,
          status: 'APPROVED',
        },
        data: {
          status: 'BORROWED',
          borrowedDate: new Date(),
          updatedAt: new Date(),
        },
      });

      // อัปเดตสถานะ BorrowingDetail เป็น APPROVED (ถ้าต้องการให้สอดคล้อง)
      if (updateResult.count > 0) {
        await tx.borrowingDetail.updateMany({
          where: {
            borrowing: {
              borrowerId: userId,
              status: 'BORROWED',
            },
            approvalStatus: 'APPROVED',
          },
          data: {
            approvalStatus: 'APPROVED', // หรือสถานะอื่นถ้าต้องการ
            updatedAt: new Date(),
          },
        });
      }

      return updateResult;
    });

    if (updatedBorrowings.count === 0) {
      return NextResponse.json({ error: 'No approved borrowings found to update' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status updated to BORROWED successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating borrowing status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}