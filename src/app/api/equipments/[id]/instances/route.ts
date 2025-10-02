import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
//สำหรับ ดึงInstance ของที่เลือก
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const equipmentId = Number(id);
  if (isNaN(equipmentId)) {
    return NextResponse.json({ error: "Invalid equipment id" }, { status: 400 });
  }

  const body = await req.json();
  const ids: number[] = body.ids || []; // [40,41,42,...]

  const whereCondition: any = { equipmentId: equipmentId };
  if (ids.length > 0) {
    whereCondition.id = { in: ids };
  }

  const instances = await prisma.equipmentInstance.findMany({
    where:{equipmentId,
        id: { in: ids }, 
     } ,
    select: {
      id: true,
      serialNumber: true,
      status: true,
      location: true,
      note: true,
    },
  });

  return NextResponse.json(instances);
}
