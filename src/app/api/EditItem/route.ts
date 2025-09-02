"use server"

import { NextResponse,NextRequest } from "next/server"
import prisma from "@/lib/db"


export async function PUT(req:NextRequest) {
    try{
           
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
        console.error("API: No token provided in Authorization header.");
        return NextResponse.json(
            { error: "Authentication required." },
            { status: 401 }
        );
        }
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
                lostQuantity:body.lostQuantity,
                brokenQuantity:body.lostQuantity,
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