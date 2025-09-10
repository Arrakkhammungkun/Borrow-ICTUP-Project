// src/types/borrowing.ts
export enum BorrowingStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  BORROWED = "BORROWED",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE",
}

export const statusConfig: Record<BorrowingStatus, { label: string; className: string }> = {
  [BorrowingStatus.PENDING]: { label: "กำลังรออนุมัติ", className: "bg-[#E74C3C] text-white" },
  [BorrowingStatus.APPROVED]: { label: "อนุมัตแล้ว", className: "bg-[#2ECC71] text-white" },
  [BorrowingStatus.REJECTED]: { label: "ไม่อนุมัติ", className: "bg-[#E74C3C] text-white" },
  [BorrowingStatus.BORROWED]: { label: "อยู่ระหว่างยืม", className: "bg-yellow-500 text-black" },
  [BorrowingStatus.RETURNED]: { label: "คืนแล้ว", className: "bg-[#229954] text-white" },
  [BorrowingStatus.OVERDUE]: { label: "เกินกำหนด", className: "bg-orange-600 text-white" },
};
