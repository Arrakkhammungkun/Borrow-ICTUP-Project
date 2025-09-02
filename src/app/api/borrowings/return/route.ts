import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { borrowingId, returnDetails } = body; // returnDetails: [{detailId, complete, incomplete, lost}]

  if (!borrowingId || !Array.isArray(returnDetails) || returnDetails.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // ตรวจสอบ Token
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userUpId = decoded.up_id;
  const user = await prisma.user.findUnique({ where: { up_id: userUpId } });
  if (!user) return NextResponse.json({ error: "User Not Found" }, { status: 404 });
  const userId = user.id;

  try {
    await prisma.$transaction(async (tx) => {
      for (const rd of returnDetails) {
        // หา BorrowingDetail ที่จะคืน
        const detail = await tx.borrowingDetail.findUnique({
          where: { id: rd.detailId },
          include: { equipment: true },
        });

        if (!detail) throw new Error('Detail not found');
        if (detail.equipment.ownerId !== userId) throw new Error('Not authorized for this equipment');

        const returnedQty = rd.complete + rd.incomplete;
        const totalAccounted = returnedQty + rd.lost;

        // ตรวจสอบว่าจำนวนคืน (สมบูรณ์ + ไม่สมบูรณ์ + หาย) = ของที่ยังไม่ถูกคืน
        if (totalAccounted !== detail.quantityBorrowed - detail.quantityReturned - detail.quantityLost) {
          throw new Error('Returned amounts do not match borrowed quantity');
        }

        // ✅ อัปเดต BorrowingDetail
        await tx.borrowingDetail.update({
          where: { id: rd.detailId },
          data: {
            quantityReturned: { increment: returnedQty },
            quantityLost: { increment: rd.lost },
            conditionAfterReturn: `คืนสมบูรณ์: ${rd.complete}, คืนไม่สมบูรณ์: ${rd.incomplete}, หาย: ${rd.lost}`,
          },
        });

        // ✅ อัปเดต Stock ของ Equipment
        await tx.equipment.update({
          where: { equipment_id: detail.equipmentId },
          data: {
            availableQuantity: { increment: rd.complete },
            brokenQuantity: { increment: rd.incomplete },
            lostQuantity: { increment: rd.lost },
            inUseQuantity: { decrement: totalAccounted },
          },
        });

        // ✅ เก็บ ReturnHistory
        await tx.returnHistory.create({
          data: {
            borrowingDetailId: rd.detailId,
            complete: rd.complete,
            incomplete: rd.incomplete,
            lost: rd.lost,
          },
        });
      }

      //  ตรวจสอบว่าคืนครบหรือยัง
      const allDetails = await tx.borrowingDetail.findMany({ where: { borrowingId } });
      const isFullyReturned = allDetails.every(
        (d) => d.quantityReturned + d.quantityLost === d.quantityBorrowed
      );

      if (isFullyReturned) {
        await tx.borrowing.update({
          where: { id: borrowingId },
          data: { status: 'RETURNED', returnedDate: new Date() },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to return' }, { status: 500 });
  }
}
