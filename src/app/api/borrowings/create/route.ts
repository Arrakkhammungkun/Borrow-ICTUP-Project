import { NextResponse,NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // npm i jsonwebtoken @types/jsonwebtoken

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { equipmentId, quantity, startDate, endDate, returnDate, purpose, usageLocation,department } = body;

  if (!equipmentId || !quantity || quantity <= 0 || !returnDate || !startDate || !department) {
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
      const equipment = await tx.equipment.findUnique({ 
        where: { equipment_id: equipmentId } ,
        include: { owner: true },
      });
      if (!equipment || equipment.availableQuantity < quantity || equipment.status !== 'AVAILABLE') {
        throw new Error('Equipment not available');
      }

      const ownerName = equipment.owner.displayName ||
        `${equipment.owner.prefix || ''} ${equipment.owner.first_name || ''} ${equipment.owner.last_name || ''}`.trim() ||
        'ไม่ระบุเจ้าของ';

      const newBorrowing = await tx.borrowing.create({
        data: {
          borrower: {
            connect: { up_id: borrowerUpId }, // ✅ ชี้ไปยัง User ที่มีอยู่แล้ว โดยใช้ up_id (unique string)
          },
          requestedStartDate: new Date(startDate),
          dueDate: new Date(returnDate),
          status: 'PENDING',
          location:usageLocation
        },
      });

      await tx.borrowingDetail.create({
        data: {
          borrowingId: newBorrowing.id,
          equipmentId,
          quantityBorrowed: quantity,
          approvalStatus: 'PENDING',
          note: `Purpose: ${purpose || ''}, Location: ${usageLocation || ''}, Start: ${startDate || ''}, End: ${endDate || ''}`,
          department:department,
          
        },
      });

      // Optional: Lock quantity
      await tx.equipment.update({ where: { equipment_id: equipmentId }, data: { availableQuantity: { decrement: quantity } } });

      return { borrowing: newBorrowing, ownerName };
    });
    // หลังสร้าง สามารถส่ง notification ให้ owner ที่นี่ (ใช้ ownerName ถ้าต้องการ)
    return NextResponse.json({ message: 'Borrowing created', borrowing }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create borrowing' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}