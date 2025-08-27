import { NextResponse } from "next/server";
import prisma from "@/lib/db";


// interface params {
//     params:{id:string}

// }

export async function GET(req:Request,context:{ params :{ id:string}}) {
    try {
        const params = await context.params; // await ก่อน
        const id = Number(params.id);


        if(isNaN(id)) {
            return NextResponse.json({ error:"Invalid ID"},{ status:400});

        }

        const equipment = await prisma.equipment.findUnique({
            where:{
                equipment_id:id
            },
            include:{
                owner:true
            },

        })
        if(!equipment || equipment.status !== 'AVAILABLE'){
            return NextResponse.json({ error:"Not found or unavailable"},{status:404})
        }

        const formattedEquipment = {
        id: equipment.equipment_id,
        code: equipment.serialNumber,
        name: equipment.name,
        unit:equipment.unit,
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