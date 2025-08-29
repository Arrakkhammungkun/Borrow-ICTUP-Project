"use server"

import { NextResponse } from "next/server"
import prisma from "@/lib/db"


export async function PUT(req:Request) {
    try{
        const body = await req.json();
        const updatedItem =await prisma.equipment.update({
            where:{equipment_id:body.equipment_id},
            data:{
                name:body.name,
                serialNumber:body.serialNumber,
                category:body.category,
                description:body.description,
                total: body.total,
                status: body.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE',
                unit: body.unit,
                storageLocation: body.storageLocation,
                state: body.state,
            }
        })
        return NextResponse.json({ success: true, data: updatedItem });
    }catch(err) {
        console.error(err);
        return NextResponse.json(
            {success:false,error:"เกิดข้อผิดพลาดในการแก้ไขข้อมูล" },
            {status:500}
        )
    }
}