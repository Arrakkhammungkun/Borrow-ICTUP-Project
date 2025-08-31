import { NextResponse } from "next/server";
import prisma from "@/lib/db";



export async function GET(req:Request,context:{ params :{ id:string}}) {
    try {
        const params = await context.params;
        const id = Number(params.id);


        if(isNaN(id)) {
            return NextResponse.json({ error:"Invalid ID"},{ status:400});

        }

        const equipment = await prisma.equipment.findUnique({
          where: { equipment_id: id },
          select: {  
            equipment_id: true,
            serialNumber: true,
            name: true,
            category: true,  
            status: true,   
            unit: true,
            total: true,
            availableQuantity: true,  
            storageLocation: true,   
            // broken: true,  // ถ้ามี field broken/Incomplete
            // lost: true,    // ถ้ามี
            owner: { select: { displayName: true, prefix: true, first_name: true, last_name: true } },
          },
        });
        if(!equipment || equipment.status !== 'AVAILABLE'){
            return NextResponse.json({ error:"Not found or unavailable"},{status:404})
        }

        const formattedEquipment = {
        id: equipment.equipment_id,
        code: equipment.serialNumber,
        name: equipment.name,
        unit:equipment.unit,
        category: equipment.category,
        status: equipment.status,  
        location: equipment.storageLocation,
        available: equipment.availableQuantity,
        owner:
            equipment.owner.displayName ||
            `${equipment.owner.prefix || ''} ${equipment.owner.first_name || ''} ${equipment.owner.last_name || ''}`.trim() ||
            'ไม่ระบุเจ้าของ',
        quantity: equipment.total,
        };

    return NextResponse.json(formattedEquipment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}



export async function PUT(req: Request, context: { params: { id: string } }) {
  try {
    const params = context.params;
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // ดึงข้อมูลเดิมเพื่อคำนวณ
    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: id },
      select: { total: true, availableQuantity: true },
    });
    if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    // คำนวณส่วนต่างของ total
    const diff = body.total - equipment.total;

    // อัปเดต availableQuantity โดยเพิ่มตามส่วนต่าง (ถ้า total เพิ่ม, available ก็เพิ่มตาม)
    // ถ้า diff < 0, available จะลดลงแต่ไม่ต่ำกว่า 0
    const newAvailable = Math.max(equipment.availableQuantity + diff, 0);

    const updatedEquipment = await prisma.equipment.update({
      where: { equipment_id: id },
      data: {
        serialNumber: body.serialNumber,
        name: body.name,
        category: body.category,
        status: body.status,
        unit: body.unit,
        total: body.total,
        storageLocation: body.storageLocation,
        availableQuantity: newAvailable,
        // ถ้ามี field broken และ lost ใน schema ของคุณ ให้ uncomment และปรับ logic ถ้าต้องการ
        // broken: body.broken,
        // lost: body.lost,
      },
    });
    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดต' }, { status: 500 });
  }
}


export async function DELETE(req: Request, context: { params: { id: string } }) {
  try {
    const params = context.params;
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // ดึงข้อมูลเพื่อเช็คว่ามีอยู่ไหม
    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: id },
    });
    if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ลบอุปกรณ์
    await prisma.equipment.delete({
      where: { equipment_id: id },
    });

    return NextResponse.json({ message: "ลบอุปกรณ์สำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' }, { status: 500 });
  }
}