import { NextResponse,NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // npm i jsonwebtoken @types/jsonwebtoken

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { equipmentId, quantity, startDate, endDate, returnDate, purpose, usageLocation } = body;

  if (!equipmentId || !quantity || quantity <= 0 || !returnDate) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Verify token จาก cookie
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string };
  } catch  {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  const borrowerUpId = decoded.up_id;

  try {
    const borrowing = await prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({ where: { equipment_id: equipmentId } });
      if (!equipment || equipment.availableQuantity < quantity || equipment.status !== 'AVAILABLE') {
        throw new Error('Equipment not available');
      }

      const newBorrowing = await tx.borrowing.create({
        data: {
          borrower: {
            connect: { up_id: borrowerUpId }, // ✅ ชี้ไปยัง User ที่มีอยู่แล้ว โดยใช้ up_id (unique string)
          },
          dueDate: new Date(returnDate),
          status: 'PENDING',
        },
      });

      await tx.borrowingDetail.create({
        data: {
          borrowingId: newBorrowing.id,
          equipmentId,
          quantityBorrowed: quantity,
          approvalStatus: 'PENDING',
          note: `Purpose: ${purpose || ''}, Location: ${usageLocation || ''}, Start: ${startDate || ''}, End: ${endDate || ''}`,
        },
      });

      // Optional: Lock quantity
      // await tx.equipment.update({ where: { equipment_id: equipmentId }, data: { availableQuantity: { decrement: quantity } } });

      return newBorrowing;
    });

    return NextResponse.json({ message: 'Borrowing created', borrowing }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create borrowing' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}