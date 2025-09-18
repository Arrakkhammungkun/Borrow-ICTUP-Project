import { NextResponse,NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // npm i jsonwebtoken @types/jsonwebtoken
import { sendNotificationEmail } from '@/lib/sendNotificationEmail';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { 
    equipmentId, 
    quantity, 
    startDate,  
    returnDate, 
    purpose, 
    usageLocation,
    department,
    endDate ,

  } = body; 

  const title = body.title;
  const firstname = body.firstname;
  const lastname = body.lastname;
  const position = body.position;


  if (!equipmentId || !quantity || quantity <= 0 || !returnDate || !startDate || !department || !endDate) {
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
      const mailOwner = equipment.owner.email
      const FirstNameOwner =equipment.owner.first_name || ""
      const LastNameOwner =equipment.owner.last_name|| ""

      const ownerName = equipment.owner.displayName ||
        `${equipment.owner.prefix || ''} ${equipment.owner.first_name || ''} ${equipment.owner.last_name || ''}`.trim() ||
        'ไม่ระบุเจ้าของ';

      const newBorrowing = await tx.borrowing.create({
        data: {
          borrower: {
            connect: { up_id: borrowerUpId }, 
          },
          requestedStartDate: new Date(startDate),
          dueDate: new Date(returnDate),
          status: 'PENDING',
          location:usageLocation,
          borrowedDate:new Date(endDate),
          borrower_title: title ,
          borrower_firstname: firstname ,
          borrower_lastname: lastname ,
          borrower_position: position ,
        },
      });

      await tx.borrowingDetail.create({
        data: {
          borrowingId: newBorrowing.id,
          equipmentId,
          quantityBorrowed: quantity,
          approvalStatus: 'PENDING',
          note: purpose ,
          department:department,
          
        },
      });

      // Optional: Lock quantity
      await tx.equipment.update({ 
        where: { equipment_id: equipmentId }, 
        data: 
        { 
          availableQuantity: { decrement: quantity },
          inUseQuantity: { increment: quantity }, 
          
        }
      
      });

      return { borrowing: newBorrowing, 
        ownerName ,
        mailOwner, 
        FirstNameOwner,
        LastNameOwner,
        equipment,
      };
    });
    await sendNotificationEmail("BORROW_PENDING", {
      to: borrowing.mailOwner,
      firstName: borrowing.FirstNameOwner,
      lastName: borrowing.LastNameOwner,
      borrowerName: `${firstname} ${lastname}`,
      borrowDate: startDate,
      borrowId: borrowing.borrowing.id,
    });

    return NextResponse.json({ message: 'สร้างรายการยืมสำเร็จ', borrowing }, { status: 201 });


          
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'สร้างรายการยืมผิดพลาด' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}