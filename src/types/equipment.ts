// ข้อมูลอุปกรณ์ (Equipment)
export interface Equipment {
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

// ข้อมูลประวัติการยืมคืน (History)
export interface EquipmentHistory {
  id: number;
  name: string;
  borrowDate: string; // ISO string (yyyy-MM-dd)
  dueDate: string;
  returnDate: string | null;
  quantity: number;
  place: string;
  status: string;
  statusColor: string; // className สำหรับสี เช่น text-green-500
}
