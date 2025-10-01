// ข้อมูลอุปกรณ์ (Equipment)
// export interface Equipment {
//   id: number;
//   code: string;
//   name: string;
//   category: string;
//   status: "ยืมได้" | "อยู่ระหว่างยืม" | "งดการยืม" | "เลิกใช้งาน";
//   location: string;
//   all: number;
//   used: number;
//   available: number;
//   broken: number;
//   lost: number;
//   unit: string;
//   description:string;
  
// }
export interface Equipment {
  id: number;
  code: string;
  name: string;
  category: string;
  status: string;
  location: string;
  all: number;
  available: number;
  used: number;
  broken: number;
  lost: number;
  unit: string;
  description: string;
  isIndividual: boolean;
  owner:string
  instances: {
    id: number;
    serialNumber: string;
    status: string;
    location: string;
    note: string;
  }[];
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
  overallReturnNote?: string;
  equipmentInstance?: {
    serialNumber: string;
    status: string; // "AVAILABLE" | "IN_USE" | "BROKEN" | "LOST"
    note: string;
  };
  instances?: {
    serialNumber: string;
    status: string;
    note: string;
    condition?: string | null; // ดึงจาก returnHistories[0]?.condition
  }[];
  returnHistories?: {
    condition: string;
    note: string | null;
    returnedAt: string;
  }[];
}

export interface EquipmentInstanceHistory {
  serialNumber: string;
  status: string; 
  note: string;
  condition?: "ชำรุด" | "สูญหาย" | "สมบูรณ์" | null;
}