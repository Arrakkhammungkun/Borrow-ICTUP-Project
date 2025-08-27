import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // borrow or owner
    const search =searchParams.get('search')

    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string }
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userUpId = decoded.up_id;

    const user = await prisma.user.findUnique({
        where: {
            up_id: userUpId
        }
    })
    if (!user) return NextResponse.json({ error: "User Not Found" }, { status: 404 })
    const userId = user.id;
    try {
        let data;
        if (type === 'borrower') {
            const borrowings = await prisma.borrowing.findMany({
                where: {
                    borrowerId: userId, status: { notIn: ['RETURNED', 'REJECTED'] },
                    ...(search ? {id:Number(search) } :{})
                },
                include: {
                    details: {
                        include: {
                            equipment: {
                                include: { owner: true }  // ✅ เพิ่ม include owner เพื่อดึงข้อมูลชื่อ
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            // ✅ Map เพื่อเพิ่ม ownerName และ requestedStartDate (ถ้าต้องการ format เพิ่ม)
            data = borrowings.map(borrowing => {
                const detail = borrowing.details[0];  // สมมติ 1 detail ต่อ borrowing
                const owner = detail?.equipment.owner;
                const ownerName = owner ? 
                    owner.displayName || 
                    `${owner.prefix || ''} ${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 
                    'ไม่ระบุเจ้าของ' : 'ไม่ระบุ';

                return {
                    ...borrowing,
                    requestedStartDate: borrowing.requestedStartDate ? new Date(borrowing.requestedStartDate).toISOString() : null,  // ✅ ส่งวันที่เริ่มยืม (format เป็น ISO ถ้าต้องการ)
                    ownerName  // ✅ เพิ่ม field ชื่อเจ้าของ
                };
            });
        } else if (type === 'owner') {
            const details = await prisma.borrowingDetail.findMany({
                where: {
                    approvalStatus: 'PENDING',
                    equipment: { ownerId: userId },
                    ...(search ? {borrowingId :Number(search) } :{})
                },
                include: {
                    borrowing: { include: { borrower: true } },
                    equipment: {
                        include: { owner: true }  // ✅ เพิ่ม include owner ถ้าต้องการ (แต่จริงๆ owner คือ user ตัวเอง)
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            // ✅ Map เพื่อเพิ่ม ownerName (แต่สำหรับ owner คือตัวเอง, ถ้าต้องการส่งชื่อ equipment owner)
            data = details.map(detail => {
                const owner = detail.equipment.owner;
                const ownerName = owner ? 
                    owner.displayName || 
                    `${owner.prefix || ''} ${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 
                    'ไม่ระบุเจ้าของ' : 'ไม่ระบุ';

                return {
                    ...detail,
                    requestedStartDate: detail.borrowing.requestedStartDate ? new Date(detail.borrowing.requestedStartDate).toISOString() : null,  // ✅ ส่งวันที่เริ่มยืมจาก borrowing
                    ownerName  // ✅ เพิ่ม field ชื่อเจ้าของ
                };
            });
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}