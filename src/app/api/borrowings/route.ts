import { NextResponse, NextRequest } from "next/server";
import { BorrowingStatus, PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { sendNotificationEmail } from "@/lib/sendNotificationEmail";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const statusParam = searchParams.get("status"); 
    let statusFilter: BorrowingStatus[] | undefined;

    if (statusParam) {
    statusFilter = statusParam.split(",") as BorrowingStatus[];
    }


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
        const searchId = search ? Number(search) : null;  
        if (type === 'borrower') {
            let borrowings = await prisma.borrowing.findMany({
                where: {
                    borrowerId: userId, status:  statusFilter ? { in: statusFilter } : { notIn: ['RETURNED', 'REJECTED'] },
                    ...(searchId && !isNaN(searchId) ? {id: searchId} : {})  
                },
                include: {
                    borrower: true,
                    details: {
                        include: {
                            equipment: {
                                include: { owner: true }
                            },
                            equipmentInstance: true,
                            returnHistories: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });
            borrowings = await checkAndUpdateOverdue(borrowings, userId, "borrower");

            data = borrowings.map(borrowing => {
                const detail = borrowing.details[0];
                const owner = detail?.equipment?.owner;
                const ownerName = owner ? 
                    owner.displayName || 
                    `${owner.prefix || ''} ${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 
                    'ไม่ระบุเจ้าของ' : 'ไม่ระบุ';

                return {
                    ...borrowing,
                    requestedStartDate: borrowing.requestedStartDate ? new Date(borrowing.requestedStartDate).toISOString() : null,
                    ownerName,
                    returnStatusColor: borrowing.returnStatusColor,
                    details: borrowing.details.map((detail) => ({
                    ...detail,
                    returnHistories: detail.returnHistories.map((history) => ({
                        id: history.id,
                        equipmentInstanceId: history.equipmentInstanceId,
                        condition: history.condition,
                        note: history.note,
                        returnedAt: history.returnedAt.toISOString(),
                    })),
                    })),
                };
            });
        } else if (type === 'owner') {
            let borrowings = await prisma.borrowing.findMany({
                where: {
                    status: statusFilter ? { in: statusFilter } : { notIn: ['RETURNED','REJECTED'] },
                    details: {
                        some: {
                            equipment: { ownerId: userId }
                        }
                    },
                    ...(searchId && !isNaN(searchId) ? {id: searchId} : {})  
                },
                include: {
                    borrower: true,
                    details: {
                        where: {
                            equipment: { ownerId: userId }
                        },
                        include: {
                            equipment: { include: { owner: true } },
                            equipmentInstance: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            borrowings = await checkAndUpdateOverdue(borrowings, userId, "borrower");
            
            data = borrowings.map(borrowing => {
                const detail = borrowing.details[0];
                const owner = detail?.equipment?.owner;
                const ownerName = owner ? 
                    owner.displayName || 
                    `${owner.prefix || ''} ${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 
                    'ไม่ระบุเจ้าของ' : 'ไม่ระบุ';

                return {
                    ...borrowing,
                    requestedStartDate: borrowing.requestedStartDate ? new Date(borrowing.requestedStartDate).toISOString() : null,
                    dueDate: borrowing.dueDate ? new Date(borrowing.dueDate).toISOString() : null,
                    borrowerName: borrowing.borrower ? 
                        borrowing.borrower.displayName || 
                        `${borrowing.borrower.prefix || ''} ${borrowing.borrower.first_name || ''} ${borrowing.borrower.last_name || ''}`.trim() || 
                        'ไม่ระบุผู้ยืม' : 'ไม่ระบุ',
                    ownerName,
                    returnStatusColor: borrowing.returnStatusColor,
                    details: borrowing.details.map((detail) => ({
                        ...detail,

                    })),

                };
            });
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}


export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const { borrowingId, action } = body;
    if (!borrowingId || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string };
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userUpId = decoded.up_id;

    const user = await prisma.user.findUnique({ where: { up_id: userUpId } });
    if (!user) return NextResponse.json({ error: "User Not Found" }, { status: 404 });
    const userId = user.id;

    try {
        const borrowing = await prisma.borrowing.findUnique({
            where: { id: borrowingId },
            include: {
                borrower: true,
                details: {
                    include: {
                        equipment: true,
                        equipmentInstance: true, 
                    }
                }
            }
        });

        if (!borrowing) {
            return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
        }

        const detailsToUpdate = await prisma.borrowingDetail.findMany({
            where: {
                borrowingId,
                equipment: { ownerId: userId },
                approvalStatus: 'PENDING'
            },
            include: { equipment: true, equipmentInstance: true }
        });

        if (detailsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No pending details to update' }, { status: 400 });
        }

        const newApprovalStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

        await prisma.$transaction(async (tx) => {
            if (action === 'reject') {
                for (const det of detailsToUpdate) {
                    if (!det.equipmentInstanceId) {
                        throw new Error(`BorrowingDetail ${det.id} has no equipmentInstanceId`);
                    }
                    
                    await tx.equipmentInstance.update({
                        where: { id: det.equipmentInstanceId },
                        data: { status: 'AVAILABLE' },
                    });

                    // อัปเดตจำนวนใน Equipment
                    await tx.equipment.update({
                        where: { equipment_id: det.equipmentId },
                        data: {
                            availableQuantity: { increment: det.quantityBorrowed },
                            inUseQuantity: { decrement: det.quantityBorrowed },
                        }
                    });
                }
            }

            await tx.borrowingDetail.updateMany({
                where: {
                    borrowingId,
                    equipment: { ownerId: userId },
                    approvalStatus: 'PENDING'
                },
                data: {
                    approvalStatus: newApprovalStatus,
                    approvedById: userId,
                    approvedAt: new Date()
                }
            });

            const allDetails = await tx.borrowingDetail.findMany({ where: { borrowingId } });
            const allApproved = allDetails.every(d => d.approvalStatus === 'APPROVED');
            const hasRejected = allDetails.some(d => d.approvalStatus === 'REJECTED');

            let newBorrowingStatus: BorrowingStatus;
            if (hasRejected) {
                newBorrowingStatus = 'REJECTED';
            } else if (allApproved) {
                newBorrowingStatus = 'APPROVED';
            } else {
                newBorrowingStatus = 'PENDING';
            }

            await tx.borrowing.update({
                where: { id: borrowingId },
                data: { status: newBorrowingStatus }
            });

            // ส่งอีเมลแจ้งเตือน
            if (newBorrowingStatus === 'APPROVED' || newBorrowingStatus === 'REJECTED') {
                const notificationType = newBorrowingStatus === 'APPROVED' ? 'BORROW_APPROVED' : 'BORROW_REJECTED';
                await sendNotificationEmail(notificationType, {
                    to: borrowing.borrower.email,
                    firstName: borrowing.borrower.first_name || '',
                    lastName: borrowing.borrower.last_name || '',
                    borrowId: borrowingId,
                    borrowDate: borrowing.requestedStartDate ? new Date(borrowing.requestedStartDate).toLocaleDateString('th-TH') : 'ไม่ระบุ',
                    returnDate: borrowing.dueDate ? new Date(borrowing.dueDate).toLocaleDateString('th-TH') : 'ไม่ระบุ',
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message || 'Failed to update' }, { status: 500 });
    } finally {
 
    }
}

async function checkAndUpdateOverdue(
  borrowings: any[],
  userId: number,
  type: "borrower" | "owner"
) {
  if (borrowings.length === 0) return borrowings;

  const now = new Date();
  const overdueIds: number[] = [];

  for (const borrowing of borrowings) {
    if (
      borrowing.status === "BORROWED" &&
      borrowing.dueDate &&
      new Date(borrowing.dueDate) < now
    ) {
      overdueIds.push(borrowing.id);
    }
  }

  if (overdueIds.length > 0) {
    await prisma.borrowing.updateMany({
      where: { id: { in: overdueIds }, status: "BORROWED" },
      data: { status: "OVERDUE" },
    });

    // re-fetch ข้อมูลใหม่
    if (type === "borrower") {
      borrowings = await prisma.borrowing.findMany({
        where: {
          borrowerId: userId,
          status: { notIn: ["RETURNED", "REJECTED"] },
        },
        include: {
          details: { include: { equipment: { include: { owner: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      borrowings = await prisma.borrowing.findMany({
        where: {
          status: { notIn: ["RETURNED", "REJECTED"] },
          details: { some: { equipment: { ownerId: userId } } },
        },
        include: {
          borrower: true,
          details: {
            where: { equipment: { ownerId: userId } },
            include: { equipment: { include: { owner: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return borrowings;
}