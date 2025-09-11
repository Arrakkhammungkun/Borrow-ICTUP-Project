import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { borrowingId, returnDetails } = body; // returnDetails: [{detailId, complete, incomplete, lost}]

  // ตรวจสอบ input
  if (!borrowingId || !Array.isArray(returnDetails) || returnDetails.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // ตรวจสอบว่า returnDetails มีค่าที่ถูกต้อง
  for (const rd of returnDetails) {
    if (
      typeof rd.detailId !== 'number' ||
      typeof rd.complete !== 'number' || rd.complete < 0 ||
      typeof rd.incomplete !== 'number' || rd.incomplete < 0 ||
      typeof rd.lost !== 'number' || rd.lost < 0
    ) {
      return NextResponse.json({ error: 'Invalid return details (complete, incomplete, lost must be non-negative numbers)' }, { status: 400 });
    }
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
        // หา BorrowingDetail
        const detail = await tx.borrowingDetail.findUnique({
          where: { id: rd.detailId },
          include: { equipment: true },
        });

        if (!detail) throw new Error(`Detail not found for ID: ${rd.detailId}`);
        if (detail.equipment.ownerId !== userId) throw new Error('Not authorized for this equipment');

        const returnedQty = rd.complete + rd.incomplete;
        const totalAccounted = returnedQty + rd.lost;

        // ตรวจสอบจำนวนที่คืน
        const remainingToReturn = detail.quantityBorrowed - detail.quantityReturned - detail.quantityLost;
        console.log(`Detail ID: ${rd.detailId}, Remaining to return: ${remainingToReturn}, Total accounted: ${totalAccounted}`);
        if (totalAccounted !== remainingToReturn) {
          throw new Error(`Returned amounts do not match remaining quantity for detail ID: ${rd.detailId}`);
        }

        // อัปเดต BorrowingDetail
        await tx.borrowingDetail.update({
          where: { id: rd.detailId },
          data: {
            quantityReturned: { increment: returnedQty },
            quantityLost: { increment: rd.lost },
            conditionAfterReturn: `คืนสมบูรณ์: ${rd.complete}, คืนไม่สมบูรณ์: ${rd.incomplete}, หาย: ${rd.lost}`,
          },
        });

        // อัปเดต Equipment
        console.log(`Updating Equipment ID: ${detail.equipmentId}, Decrement inUseQuantity by: ${totalAccounted}`);
        await tx.equipment.update({
          where: { equipment_id: detail.equipmentId },
          data: {
            availableQuantity: { increment: rd.complete },
            brokenQuantity: { increment: rd.incomplete },
            lostQuantity: { increment: rd.lost },
            inUseQuantity: { decrement: totalAccounted },
          },
        });

        // บันทึก ReturnHistory
        await tx.returnHistory.create({
          data: {
            borrowingDetailId: rd.detailId,
            complete: rd.complete,
            incomplete: rd.incomplete,
            lost: rd.lost,
          },
        });
      }

      // ตรวจสอบว่าคืนครบหรือยัง
      const allDetails = await tx.borrowingDetail.findMany({ where: { borrowingId } });
      const isFullyReturned = allDetails.every(
        (d) => d.quantityReturned + d.quantityLost === d.quantityBorrowed
      );

      let returnStatusColor = '';
        if (isFullyReturned) {
          const hasLost = allDetails.some((d) => d.quantityLost > 0);
          const hasIncomplete = allDetails.some(async (d) => {
            const returnHistory = await tx.returnHistory.findMany({
              where: { borrowingDetailId: d.id },
            });
            return returnHistory.some((rh) => rh.incomplete > 0);
          });

          if (hasLost) {
            returnStatusColor = 'red'; 
          } else if (hasIncomplete) {
            returnStatusColor = 'yellow'; 
          } else {
            returnStatusColor = 'green'; 
          }

          await tx.borrowing.update({
            where: { id: borrowingId },
            data: {
              status: 'RETURNED',
              returnedDate: new Date(),
              returnStatusColor, 
            },
          });
        }
      
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in return process:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to return' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}