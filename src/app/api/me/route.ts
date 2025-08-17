import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";

const jwtSecret =process.env.JWT_SECRET!;



export async function GET(req:NextRequest) {
    const token = req.cookies.get("auth_token")?.value;

    if(!token){
        return NextResponse.json({ user:null},{status : 401});

    }

    try{
        const decoded = jwt.verify(token,jwtSecret) as {up_id : string};  
        const userData = await prisma.user.findUnique({
            where: {up_id:decoded.up_id},
            select:{
                email:true,
                prefix:true,
                title:true,
                displayName:true,
                jobTitle:true,
                mobilePhone:true,
                officeLocation:true,
            }
        })
        if (!userData) {
        return NextResponse.json({ user: null }, { status: 404 });
        }
        return NextResponse.json({  user:userData})
    } catch (err: unknown) {
    if (err instanceof Error) {
        return NextResponse.json(
        { error: err.message || 'Unauthorized' },
        { status: 401 }
        );
    } else {
        return NextResponse.json(
        { error: 'Unexpected error' },
        { status: 500 }
        );
    }
    }
}