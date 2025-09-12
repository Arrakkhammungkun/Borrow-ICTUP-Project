// types/borrowing.ts

export type User = {
  id: number;
  displayName: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
};

export type Equipment = {
  equipment_id: number;
  name: string;
  availableQuantity: number;
  unit: string;
  owner: User;
  serialNumber:string;
};


export type BorrowingDetail = {
  id: number;
  equipmentId: number;
  quantityBorrowed: number;
  quantityReturned: number;
  note?: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  equipment: Equipment;
  department:string
  borrowingId: number;
  approvedAt: string | null;
  approvedById: number | null;
  conditionAfterReturn: string | null;
  createdAt: string;
  updatedAt: string;
  returnHistories: ReturnHistory[];

};
export interface ReturnHistory {
  id: number;
  complete: number;
  incomplete: number;
  lost: number;
  note?: string;
  returnedAt: string;
}
export type Borrowing = {
  id: number;
  borrowerId: number;
  borrowerName: string;
  borrower: User;
  status: "PENDING" | "APPROVED" | "REJECTED" | "BORROWED" | "RETURNED" | "OVERDUE";
  requestedStartDate: string; 
  dueDate: string; 
  location?: string | null;
  reason?: string | null;
  details: BorrowingDetail[];
  quantity:number;
  ownerName:string;
  borrower_firstname:string,
  borrower_lastname: string,
  borrower_position:string;
  borrowedDate: string | null;
  returnedDate: string | null;
  createdAt: string;
  updatedAt: string;
  returnStatusColor?: string;
};



export type ReturnDetail = {
  detailId: number;
  complete: number;
  incomplete: number;
  lost: number;
  note?: string;
};


export interface EquipmentExtra {
  id: number;
  code: string;
  name: string;
  category: string;
  status: "ยืมได้" | "อยู่ระหว่างยืม" | "งดการยืม" | "เลิกใช้งาน";
  location: string;
  all: number;
  used: number;
  available: number;
  broken: number;
  lost: number;
  unit: string;
}


export interface EquipmentHistory {
  id: number;
  name: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  quantity: number;
  place: string;
  status: string;
  statusColor: string; 
}















