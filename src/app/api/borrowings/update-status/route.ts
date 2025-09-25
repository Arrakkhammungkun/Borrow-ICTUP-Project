"use server"
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  // ตรวจสอบ token
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'ต้องมีการยืนยันตัวตน' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string };
  } catch {
    return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 });
  }

  const userUpId = decoded.up_id;
  const user = await prisma.user.findUnique({ where: { up_id: userUpId } });
  if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });

  const userId = user.id;

  try {
    // รับข้อมูลจาก request body
    const { status, borrowingId } = await req.json();
    if (!status || status !== 'BORROWED') {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }
    if (!borrowingId) {
      return NextResponse.json({ error: 'ต้องระบุ borrowingId' }, { status: 400 });
    }

    // อัปเดตสถานะของ Borrowing และ BorrowingDetail ใน transaction
    const updatedBorrowings = await prisma.$transaction(async (tx) => {
      // อัปเดตสถานะ Borrowing
      const updateResult = await tx.borrowing.updateMany({
        where: {
          id: parseInt(borrowingId),
          borrowerId: userId,
          status: 'APPROVED',
        },
        data: {
          status: 'BORROWED',
          updatedAt: new Date(),
        },
      });

      // อัปเดต BorrowingDetail
      if (updateResult.count > 0) {
        await tx.borrowingDetail.updateMany({
          where: {
            borrowing: {
              id: parseInt(borrowingId),
              borrowerId: userId,
              status: 'BORROWED',
            },
            approvalStatus: 'APPROVED',
          },
          data: {
            approvalStatus: 'APPROVED',
            updatedAt: new Date(),
          },
        });
      }

      return updateResult;
    });

    if (updatedBorrowings.count === 0) {
      return NextResponse.json({ error: 'ไม่พบการยืมที่ได้รับการอนุมัติให้อัปเดต' }, { status: 404 });
    }

    return NextResponse.json({ message: 'อัปเดตสถานะเป็น BORROWED สำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตสถานะได้' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}