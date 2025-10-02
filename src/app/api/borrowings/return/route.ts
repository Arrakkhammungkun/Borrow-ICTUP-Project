import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, EquipmentStatus, ApprovalStatus } from "@prisma/client"; // เพิ่ม import EquipmentStatus
import jwt from 'jsonwebtoken';
import { sendNotificationEmail } from "@/lib/sendNotificationEmail";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { borrowingId, returnDetails, returnNote } = body;

  // Validate input
  if (!borrowingId || !Array.isArray(returnDetails) || returnDetails.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  for (const rd of returnDetails) {
    const hasInstance = 'equipmentInstanceId' in rd;
    const hasEquip = 'equipmentId' in rd;
    if ((hasInstance && hasEquip) || (!hasInstance && !hasEquip)) {
      return NextResponse.json({ error: 'Invalid return details: must provide either equipmentInstanceId or equipmentId, but not both' }, { status: 400 });
    }
    if (hasInstance) {
      if (typeof rd.equipmentInstanceId !== 'number') {
        return NextResponse.json({ error: 'Invalid return details: equipmentInstanceId must be number' }, { status: 400 });
      }
    } else {
      if (typeof rd.equipmentId !== 'number' || typeof rd.quantity !== 'number' || rd.quantity <= 0 || !Number.isInteger(rd.quantity)) {
        return NextResponse.json({ error: 'Invalid return details: equipmentId must be number, quantity must be positive integer' }, { status: 400 });
      }
    }
    if (!['สมบูรณ์', 'ชำรุด', 'สูญหาย'].includes(rd.condition)) {
      return NextResponse.json({ error: 'Invalid return details: condition must be สมบูรณ์/ชำรุด/สูญหาย' }, { status: 400 });
    }
    if (rd.note && typeof rd.note !== 'string') {
      return NextResponse.json({ error: 'Invalid return details: note must be string' }, { status: 400 });
    }
  }

  if (returnNote && typeof returnNote !== 'string') {
    return NextResponse.json({ error: 'returnNote must be string' }, { status: 400 });
  }

  // Authenticate user
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
    const { isFullyReturned, updatedEquipments } = await prisma.$transaction(async (tx) => {
      // Validate borrowing
      const borrowing = await tx.borrowing.findUnique({
        where: { id: borrowingId },
        include: { details: { include: { equipment: true, equipmentInstance: true } } }
      });
      if (!borrowing) throw new Error('Borrowing not found');
      if (borrowing.status !== 'BORROWED' && borrowing.status !== 'OVERDUE') {
        throw new Error('Can only return BORROWED or OVERDUE borrowings');
      }

      const equipmentUpdates: { [key: number]: { available: number; broken: number; lost: number; inUse: number } } = {};

      for (const rd of returnDetails) {
        let detail;
        let quantity;
        if ('equipmentInstanceId' in rd) {
          detail = borrowing.details.find(d => d.equipmentInstanceId === rd.equipmentInstanceId);
          quantity = 1;
        } else {
          detail = borrowing.details.find(d => d.equipmentId === rd.equipmentId && d.equipmentInstanceId === null);
          quantity = rd.quantity;
        }
        if (!detail) throw new Error(`BorrowingDetail not found for ${'equipmentInstanceId' in rd ? 'equipmentInstanceId: ' + rd.equipmentInstanceId : 'equipmentId: ' + rd.equipmentId}`);
        if (detail.equipment.ownerId !== userId) throw new Error('Not authorized for this equipment');

        // Validate isIndividual matches the input type
        if ('equipmentInstanceId' in rd) {
          if (!detail.equipment.isIndividual) throw new Error('Must use equipmentId and quantity for non-individual equipment');
        } else {
          if (detail.equipment.isIndividual) throw new Error('Must use equipmentInstanceId for individual equipment');
        }

        const remaining = detail.quantityBorrowed - detail.quantityReturned - detail.quantityLost;
        if (remaining < quantity) throw new Error(`Exceed remaining quantity for ${'equipmentInstanceId' in rd ? 'instance ' + rd.equipmentInstanceId : 'equipment ' + rd.equipmentId}`);

        // Update EquipmentInstance if individual
        if ('equipmentInstanceId' in rd) {
          const statusMap: { [key: string]: EquipmentStatus } = {
            'สมบูรณ์': EquipmentStatus.AVAILABLE,
            'ชำรุด': EquipmentStatus.BROKEN,
            'สูญหาย': EquipmentStatus.LOST
          };
          const newStatus = statusMap[rd.condition];
          await tx.equipmentInstance.update({
            where: { id: rd.equipmentInstanceId },
            data: { status: newStatus }
          });
        }

        // Update BorrowingDetail
        const updateData: any = {
           conditionAfterReturn: rd.condition ,
           approvalStatus: ApprovalStatus.RETURNED,

        };
        if (rd.condition === 'สูญหาย') {
          updateData.quantityLost = { increment: quantity };
        } else {
          updateData.quantityReturned = { increment: quantity };
        }
        await tx.borrowingDetail.update({
          where: { id: detail.id },
          data: updateData
        });

        // Record ReturnHistory
        const historyData: any = {
          borrowingDetailId: detail.id,
          condition: rd.condition,
          note: rd.note || null,
          returnedAt: new Date(),
 
        };
        if ('equipmentInstanceId' in rd) {
          historyData.equipmentInstanceId = rd.equipmentInstanceId;
        }
        await tx.returnHistory.create({ data: historyData });

        // Accumulate for Equipment update
        const equipmentId = detail.equipmentId;
        if (!equipmentUpdates[equipmentId]) {
          equipmentUpdates[equipmentId] = { available: 0, broken: 0, lost: 0, inUse: 0 };
        }
        equipmentUpdates[equipmentId].inUse -= quantity;
        if (rd.condition === 'สมบูรณ์') equipmentUpdates[equipmentId].available += quantity;
        if (rd.condition === 'ชำรุด') equipmentUpdates[equipmentId].broken += quantity;
        if (rd.condition === 'สูญหาย') equipmentUpdates[equipmentId].lost += quantity;
      }

      // Update Equipment quantities
      for (const [equipmentId, counts] of Object.entries(equipmentUpdates)) {
        await tx.equipment.update({
          where: { equipment_id: parseInt(equipmentId) },
          data: {
            availableQuantity: { increment: counts.available },
            brokenQuantity: { increment: counts.broken },
            lostQuantity: { increment: counts.lost },
            inUseQuantity: { increment: counts.inUse }
          }
        });
      }

      // Check if fully returned
      const allDetails = await tx.borrowingDetail.findMany({ where: { borrowingId } });
      const isFullyReturned = allDetails.every(
        d => d.quantityReturned + d.quantityLost >= d.quantityBorrowed
      );

      if (isFullyReturned) {
        const hasLost = allDetails.reduce((sum, d) => sum + d.quantityLost, 0) > 0;
        const hasBroken = allDetails.some(d => d.conditionAfterReturn === 'ชำรุด' && d.quantityReturned > 0);
        const returnStatusColor = hasLost ? 'red' : hasBroken ? 'yellow' : 'green';

        await tx.borrowing.update({
          where: { id: borrowingId },
          data: {
            status: 'RETURNED',
            returnedDate: new Date(),
            returnStatusColor,
            returnNote: returnNote || null
          }
        });
      }

      // Fetch updated equipments
      const equipmentIds = Object.keys(equipmentUpdates).map(id => parseInt(id));
      const updatedEquipments = await tx.equipment.findMany({
        where: { equipment_id: { in: equipmentIds } }
      });

      return { isFullyReturned, updatedEquipments };
    });

    // Send notification if fully returned
    if (isFullyReturned) {
      const borrowing = await prisma.borrowing.findUnique({
        where: { id: borrowingId },
        include: {
          borrower: { select: { email: true, first_name: true, last_name: true } },
          details: { include: { equipment: { select: { name: true } } } }
        }
      });

      if (borrowing) {
        try {
          await sendNotificationEmail('RETURN_COMPLETED', {
            to: borrowing.borrower.email,
            firstName: borrowing.borrower.first_name || borrowing.borrower_firstname || 'ผู้ยืม',
            lastName: borrowing.borrower.last_name || borrowing.borrower_lastname || '',
            returnDate: borrowing.returnedDate ? borrowing.returnedDate.toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH'),
            borrowDate: borrowing.requestedStartDate ? borrowing.requestedStartDate.toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH'),
            borrowId: borrowing.id,
            returnNote: borrowing.returnNote || 'ไม่มีหมายเหตุ'
          });
        } catch (emailError) {
          console.error('Failed to send notification:', emailError);
        }
      }
    }

    return NextResponse.json({ success: true, equipments: updatedEquipments });
  } catch (error) {
    console.error('Error in return process:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to return' }, { status: 500 });
  } 
}