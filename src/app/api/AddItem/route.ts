"use server"


import { NextResponse } from "next/server"
import prisma from "@/lib/db"


export async function  POST(req:Request) {
    try{
        const body = await req.json();

        const newItem =await prisma.equipment.create({
            data:{
                name:body.name,
                serialNumber:body.serialNumber,
                category:body.category,
                description: body.description,
                total:body.total,
                status:body.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE',
                unit:body.unit,
                storageLocation:body.storageLocation,
                state:body.state
            },

        });
        return NextResponse.json({ success:true , data:newItem},{status:201});
    }catch (err){
        console.error(err)

        return NextResponse.json({success:false,error:'เกิดข้อผิดพลาดในการสร้าง'},{status:500})
    }
    
}