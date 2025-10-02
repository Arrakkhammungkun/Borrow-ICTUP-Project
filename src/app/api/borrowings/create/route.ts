import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sendNotificationEmail } from '@/lib/sendNotificationEmail';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    equipmentId,
    equipmentInstanceIds, // เปลี่ยนจาก quantity เป็น equipmentInstanceIds
    startDate,
    returnDate,
    purpose,
    usageLocation,
    department,
    endDate,
    title,
    firstname,
    lastname,
    position,
  } = body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (
    !equipmentId ||
    !equipmentInstanceIds ||
    !Array.isArray(equipmentInstanceIds) ||
    equipmentInstanceIds.length === 0 ||
    !returnDate ||
    !startDate ||
    !department ||
    !endDate
  ) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
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

  const borrowerUpId = decoded.up_id;

  try {
    const borrowing = await prisma.$transaction(async (tx) => {
      // ตรวจสอบว่า equipment มีอยู่และถูกต้อง
      const equipment = await tx.equipment.findUnique({
        where: { equipment_id: equipmentId },
        include: { owner: true },
      });
      if (!equipment || !equipment.isIndividual) {
        throw new Error('Equipment not found or not individual-based');
      }

      // ตรวจสอบว่า equipment instances มีอยู่และ available
      const instances = await tx.equipmentInstance.findMany({
        where: {
          id: { in: equipmentInstanceIds },
          equipmentId,
          status: 'AVAILABLE',
        },
      });

      if (instances.length !== equipmentInstanceIds.length) {
        throw new Error('Some equipment instances are not available or do not belong to this equipment');
      }

      const mailOwner = equipment.owner.email;
      const FirstNameOwner = equipment.owner.first_name || '';
      const LastNameOwner = equipment.owner.last_name || '';

      const ownerName =
        equipment.owner.displayName ||
        `${equipment.owner.prefix || ''} ${equipment.owner.first_name || ''} ${
          equipment.owner.last_name || ''
        }`.trim() ||
        'ไม่ระบุเจ้าของ';

      // สร้าง borrowing
      const newBorrowing = await tx.borrowing.create({
        data: {
          borrower: {
            connect: { up_id: borrowerUpId },
          },
          requestedStartDate: new Date(startDate),
          dueDate: new Date(returnDate),
          status: 'PENDING',
          location: usageLocation,
          borrowedDate: new Date(endDate),
          borrower_title: title,
          borrower_firstname: firstname,
          borrower_lastname: lastname,
          borrower_position: position,
        },
      });

      // สร้าง borrowing detail สำหรับแต่ละ equipment instance
      const borrowingDetails = await Promise.all(
        equipmentInstanceIds.map(async (instanceId: number) => {
          return tx.borrowingDetail.create({
            data: {
              borrowingId: newBorrowing.id,
              equipmentId,
              equipmentInstanceId: instanceId,
              quantityBorrowed: 1,  
              approvalStatus: 'PENDING',
              note: purpose,
              department,
            },
          });
        })
      );

      // อัปเดตสถานะของ equipment instances เป็น IN_USE
      await tx.equipmentInstance.updateMany({
        where: { id: { in: equipmentInstanceIds } },
        data: { status: 'IN_USE' },
      });
      await tx.equipment.update({
        where: { equipment_id: equipmentId },
        data: {
          availableQuantity: { decrement: equipmentInstanceIds.length },
          inUseQuantity: { increment: equipmentInstanceIds.length },
        },
      });
      // ดึง serial numbers เพื่อใช้ในอีเมล
      const serialNumbers = instances.map((instance) => instance.serialNumber).join(', ');

      return {
        borrowing: newBorrowing,
        ownerName,
        mailOwner,
        FirstNameOwner,
        LastNameOwner,
        equipment,
        serialNumbers,
        borrowingDetails
      };
    });

    // ส่งอีเมลแจ้งเตือน
    await sendNotificationEmail('BORROW_PENDING', {
      to: borrowing.mailOwner,
      firstName: borrowing.FirstNameOwner,
      lastName: borrowing.LastNameOwner,
      borrowerName: `${firstname} ${lastname}`,
      borrowDate: startDate ? new Date(startDate).toLocaleDateString('th-TH') : 'ไม่ระบุ',
      borrowId: borrowing.borrowing.id,
      returnDate: returnDate ? new Date(returnDate).toLocaleDateString('th-TH') : 'ไม่ระบุ',
    });

    return NextResponse.json(
      { message: 'สร้างรายการยืมสำเร็จ', borrowing: borrowing.borrowing ,borrowingDetails: borrowing.borrowingDetails, },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'สร้างรายการยืมผิดพลาด' }, { status: 500 });
  }
}