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
  [BorrowingStatus.PENDING]: { label: "กำลังรออนุมัติ", className: "bg-red-100 text-red-700" },
  [BorrowingStatus.APPROVED]: { label: "อนุมัตแล้ว", className: "bg-green-100 text-green-700" },
  [BorrowingStatus.REJECTED]: { label: "ไม่อนุมัติ", className: "bg-[#E74C3C] text-white" },
  [BorrowingStatus.BORROWED]: { label: "อยู่ระหว่างยืม", className: "bg-yellow-100 text-yellow-700" },
  [BorrowingStatus.RETURNED]: { label: "คืนแล้ว", className: "bg-[#229954] text-white" },
  [BorrowingStatus.OVERDUE]: { label: "เกินกำหนด", className: "bg-orange-100 text-orange-700" },
};
