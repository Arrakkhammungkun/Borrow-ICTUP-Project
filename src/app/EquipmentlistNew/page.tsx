"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Equipment, EquipmentHistory } from "@/types/equipment";
import Swal from "sweetalert2";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClockRotateLeft,
  faFile,
  faMagnifyingGlass,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

// ------------------ MOCK DATA ------------------
// ข้อมูลจำลองสำหรับรายการอุปกรณ์
const mockEquipmentData: Equipment[] = [
  {
    id: 1,
    code: "EQ001",
    name: "โน๊ตบุ๊ค Dell Latitude",
    description: "Core i5, RAM 16GB, SSD 512GB",
    category: "อุปกรณ์ IT",
    status: "ยืมได้",
    location: "ห้อง A-101",
    all: 10,
    used: 2,
    available: 8,
    broken: 0,
    lost: 0,
    unit: "เครื่อง",
  },
  {
    id: 2,
    code: "EQ002",
    name: "โปรเจคเตอร์ Epson",
    description: "ความสว่าง 3500 ลูเมน",
    category: "อุปกรณ์โสตทัศนศึกษา",
    status: "อยู่ระหว่างยืม",
    location: "ห้อง B-203",
    all: 5,
    used: 5,
    available: 0,
    broken: 0,
    lost: 0,
    unit: "เครื่อง",
  },
  {
    id: 3,
    code: "EQ003",
    name: "กล้อง Canon EOS 80D",
    description: "พร้อมเลนส์ Kit 18-135mm",
    category: "อุปกรณ์ถ่ายภาพ",
    status: "ยืมได้",
    location: "ห้อง C-305",
    all: 3,
    used: 1,
    available: 2,
    broken: 0,
    lost: 0,
    unit: "ชุด",
  },
  {
    id: 4,
    code: "EQ004",
    name: "ไมโครโฟนไร้สาย Shure",
    description: "ไมค์คู่สำหรับงานบรรยาย",
    category: "อุปกรณ์เสียง",
    status: "งดการยืม",
    location: "ตู้เก็บ D-401",
    all: 8,
    used: 0,
    available: 8,
    broken: 0,
    lost: 0,
    unit: "ชุด",
  },
  {
    id: 5,
    code: "EQ005",
    name: "เครื่องพิมพ์ 3 มิติ",
    description: "ยี่ห้อ XYZprinting",
    category: "อุปกรณ์พิเศษ",
    status: "เลิกใช้งาน",
    location: "ห้องปฏิบัติการ E-502",
    all: 1,
    used: 0,
    available: 0,
    broken: 1,
    lost: 0,
    unit: "เครื่อง",
  },
  {
    id: 6,
    code: "EQ006",
    name: "iPad Pro 11-inch",
    description: "M2 Chip, 256GB Storage",
    category: "อุปกรณ์ IT",
    status: "ยืมได้",
    location: "ห้องสมุด",
    all: 15,
    used: 8,
    available: 7,
    broken: 0,
    lost: 0,
    unit: "เครื่อง",
  },
  {
    id: 7,
    code: "EQ007",
    name: "ชุดเครื่องมือช่าง",
    description: "ชุดประแจและไขควงครบชุด",
    category: "อุปกรณ์ช่าง",
    status: "ยืมได้",
    location: "ห้องซ่อมบำรุง F-110",
    all: 5,
    used: 0,
    available: 4,
    broken: 1,
    lost: 0,
    unit: "ชุด",
  },
];

// ข้อมูลจำลองสำหรับประวัติการยืมคืน
const mockHistoryData: { [key: string]: EquipmentHistory[] } = {
  EQ001: [
    {
      id: 101,
      name: "นายสมชาย ใจดี",
      borrowDate: "2025-09-25T10:00:00Z",
      dueDate: "2025-09-28T10:00:00Z",
      returnDate: null,
      quantity: 1,
      place: "ห้องประชุม 1",
      status: "อยู่ระหว่างยืม",
      statusColor: "text-blue-600",
    },
    {
      id: 102,
      name: "นางสาวสมศรี มีสุข",
      borrowDate: "2025-09-20T14:00:00Z",
      dueDate: "2025-09-22T14:00:00Z",
      returnDate: "2025-09-22T13:30:00Z",
      quantity: 1,
      place: "ใช้งานส่วนตัว",
      status: "คืนแล้ว",
      statusColor: "text-green-600",
    },
  ],
  EQ002: [
    {
      id: 201,
      name: "นายวิชัย พัฒนา",
      borrowDate: "2025-09-26T09:00:00Z",
      dueDate: "2025-09-27T17:00:00Z",
      returnDate: null,
      quantity: 5,
      place: "หอประชุมใหญ่",
      status: "อยู่ระหว่างยืม",
      statusColor: "text-blue-600",
    },
  ],
  EQ003: [
    {
      id: 301,
      name: "นางสาวจินตนา สร้างสรรค์",
      borrowDate: "2025-09-15T11:00:00Z",
      dueDate: "2025-09-18T11:00:00Z",
      returnDate: "2025-09-20T16:00:00Z",
      quantity: 1,
      place: "ถ่ายทำนอกสถานที่",
      status: "คืนเกินกำหนด",
      statusColor: "text-orange-500",
    },
  ],
  EQ006: [
    {
      id: 601,
      name: "นายธนพล เรียนเก่ง",
      borrowDate: "2025-09-27T13:00:00Z",
      dueDate: "2025-10-04T13:00:00Z",
      returnDate: null,
      quantity: 1,
      place: "ห้องสมุด",
      status: "อยู่ระหว่างยืม",
      statusColor: "text-blue-600",
    },
  ],
  // EQ004, EQ005, EQ007 ไม่มีประวัติการยืมในข้อมูลจำลอง
};

// ------------------ COMPONENT ------------------
export default function MyEquipmentList() {
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [historyData, setHistoryData] = useState<EquipmentHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const itemsPerPage = 5;
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      // จำลองการเรียก API โดยใช้ Mock Data
      await new Promise((resolve) => setTimeout(resolve, 500)); // จำลอง delay
      setEquipmentData(mockEquipmentData);
    } catch (error) {
      console.error("โหลดข้อมูลอุปกรณ์ล้มเหลว:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    let filtered = equipmentData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedStatus) {
      if (selectedStatus === "ไม่สามารถยืมได้") {
        filtered = filtered.filter(
          (item) => item.status === "งดการยืม" || item.status === "เลิกใช้งาน"
        );
      } else {
        filtered = filtered.filter((item) => item.status === selectedStatus);
      }
    }

    setFilteredEquipment(filtered);
    setCurrentPage(1);
  }, [searchQuery, equipmentData, selectedStatus]);

  // แสดงประวัติการยืมคืน
  const handleShowHistory = async (item: Equipment) => {
    setLoading(true);
    try {
      // จำลองการเรียก API โดยใช้ Mock Data
      await new Promise((resolve) => setTimeout(resolve, 500)); // จำลอง delay
      const history = mockHistoryData[item.code] || []; // ดึงข้อมูลจาก mock data, ถ้าไม่มีให้เป็น array ว่าง

      setSelectedItem(item);
      setHistoryData(history);
      setShowHistory(true);
    } catch (err: any) {
      setLoading(false);
      console.error("โหลดประวัติผิดพลาด", err);
      Swal.fire(
        "ข้อผิดพลาด!",
        err.message || "ไม่สามารถโหลดประวัติได้",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "ลบข้อมูลหรือไม่?",
      text: "คุณต้องการลบข้อมูลใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      setLoading(true);
      try {
        // จำลองการลบข้อมูล (ในการใช้งานจริงส่วนนี้จะเรียก API)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // อัปเดต state เพื่อให้ข้อมูลหายไปจาก UI
        setEquipmentData((prev) => prev.filter((item) => item.id !== id));

        setLoading(false);
        await Swal.fire("สำเร็จ!", "ลบข้อมูลสำเร็จ", "success");
      } catch (error) {
        setLoading(false);
        console.error(error);
        await Swal.fire("ข้อผิดพลาด!", "ลบข้อมูลไม่สำเร็จ", "error");
      }
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const csvData = result.data;
        if (csvData.length === 0) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: "ไฟล์ CSV ว่างเปล่า",
            icon: "error",
            draggable: true,
          });
          return;
        }

        const requiredHeaders = [
          "code",
          "name",
          "category",
          "location",
          "status",
          "quantity",
          "unit",
          "description",
          "feature",
        ];
        const headers = Object.keys(csvData[0] as object);
        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        );
        if (missingHeaders.length > 0) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: `ไฟล์ CSV ขาดคอลัมน์: ${missingHeaders.join(", ")}`,
            icon: "error",
            draggable: true,
          });
          return;
        }

        // ส่วนนี้เป็นการจำลอง สามารถปรับแก้ตาม logic จริงได้
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
        await Swal.fire({
          title: "เพิ่มรายการสำเร็จ!",
          text: `เพิ่ม ${csvData.length} รายการจาก CSV (จำลอง)`,
          icon: "success",
          draggable: true,
        });
        // ในการใช้งานจริง ควรจะ fetch ข้อมูลใหม่หลังจากเพิ่มสำเร็จ
        // await fetchEquipment();
      },
      error: (error) => {
        setLoading(false);
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: `ไม่สามารถอ่านไฟล์ CSV: ${error.message}`,
          icon: "error",
          draggable: true,
        });
      },
    });

    e.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">
              รายการอุปกรณ์ของฉัน
            </h1>
          </div>
          {loading && <FullScreenLoader />}
          <hr className="mb-6 border-[#DCDCDC]" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 rounded w-full sm:w-64 h-10 border-[#87A9C4] border-2 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4]"
                  placeholder="ค้นหารายการ, รหัส, หมวดหมู่"
                />
                <button className="bg-[#25B99A] text-white px-3 py-2 sm:px-4 sm:py-2 h-10 rounded hover:bg-teal-600 w-fit sm:w-auto flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                  ค้นหา
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Link href={"/AddItem"}>
                <button
                  type="button" // เปลี่ยนเป็น button เพื่อไม่ให้ฟอร์ม submit
                  className="bg-[#25B99A] text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-green-600 w-full sm:w-auto text-sm sm:text-base cursor-pointer"
                >
                  เพิ่มรายการ
                </button>
              </Link>
              <label
                htmlFor="csv-upload"
                className="bg-[#3498DB] text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-600 cursor-pointer w-full sm:w-auto flex items-center justify-center text-sm sm:text-base"
              >
                เพิ่มแบบ CSV
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 text-xs sm:text-sm justify-start sm:justify-end">
            {["ALL", "ยืมได้", "อยู่ระหว่างยืม", "ไม่สามารถยืมได้"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() =>
                    setSelectedStatus(status === "ALL" ? null : status)
                  }
                  className={`flex items-center gap-1 px-3 py-1 rounded ${
                    (status === "ALL" && selectedStatus === null) ||
                    selectedStatus === status
                      ? "text-[#996000]"
                      : "text-gray-800 hover:text-[#996000] cursor-pointer"
                  }`}
                >
                  <span>{status === "ALL" ? "ทั้งหมด" : status}</span>
                  <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
                    {status === "ALL"
                      ? equipmentData.length
                      : status === "ไม่สามารถยืมได้"
                        ? equipmentData.filter(
                            (item) =>
                              item.status === "งดการยืม" ||
                              item.status === "เลิกใช้งาน"
                          ).length
                        : equipmentData.filter((item) => item.status === status)
                            .length}
                  </span>
                </button>
              )
            )}
          </div>

          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full table-auto text-xs sm:text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white text-xs sm:text-sm">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-r">
                    รายการ
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    ทั้งหมด
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    อยู่ระหว่างยืม
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    สมบูรณ์
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    ไม่สมบูรณ์
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    หาย
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                    หน่วย
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipment.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border px-3 py-3 sm:px-4 sm:py-3 text-center text-gray-500 text-xs sm:text-sm"
                    >
                      ไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  paginatedEquipment.map((item, i) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-3 sm:px-4 sm:py-3 align-top border-r">
                        <div>
                          <div>รหัส {item.code}</div>
                          <div>ชื่อ: {item.name}</div>
                          <div>รายละเอียด: {item.description}</div>
                          <div>หมวดหมู่: {item.category}</div>
                          <div>
                            สถานะ:{" "}
                            <span
                              className={`${
                                item.status === "ยืมได้"
                                  ? "text-green-600"
                                  : item.status === "อยู่ระหว่างยืม"
                                    ? "text-blue-600"
                                    : "text-red-600"
                              }`}
                            >
                              {item.status === "เลิกใช้งาน" ||
                              item.status === "งดการยืม"
                                ? "ไม่สามารถยืมได้"
                                : item.status}
                            </span>
                          </div>
                          <div>สถานที่เก็บ: {item.location}</div>
                          <div className="mt-2 flex flex-wrap gap-2 ">
                            <Link href={`/EditItem/${item.id}`}>
                              <button
                                className="text-white text-xs sm:text-sm cursor-pointer items-center"
                                title="แก้ไขข้อมูลอุปกรณ์"
                              >
                                <FontAwesomeIcon
                                  icon={faPenToSquare}
                                  size="lg"
                                  className="text-[#F0AD4E] hover:text-[#996000]"
                                />
                              </button>
                            </Link>
                            <button
                              className="text-xs sm:text-sm cursor-pointer"
                              onClick={() => handleShowHistory(item)}
                              title="ประวัติการยืม"
                            >
                              <FontAwesomeIcon
                                icon={faClockRotateLeft}
                                size="lg"
                                className="text-[#364153] hover:text-[#2B5279]"
                              />
                            </button>
                            <button
                              className="text-xs sm:text-sm text-white cursor-pointer"
                              onClick={() => handleDelete(item.id)}
                              title="ลบข้อมูลอุปกรณ์"
                            >
                              <FontAwesomeIcon
                                icon={faTrashCan}
                                size="lg"
                                className="text-[#E74C3C] hover:text-[#C0392B]"
                              />
                            </button>
                            <Link href={`/ItemDetail/${item.id}`}>
                              <button
                                className="text-xs sm:text-sm text-white cursor-pointer"
                                onClick={() => handleDelete(item.id)}
                                title="รายละเอียดอุปกรณ์"
                              >
                                <FontAwesomeIcon
                                  icon={faFile}
                                  size="lg"
                                  className="text-[#4682B4] hover:text-[#2B5279]"
                                />
                              </button>
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.all}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.used}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.available}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.broken}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.lost}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center">
                        {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center mt-6 select-none text-[#25B99A]">
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-l border-gray-300 disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              {"<<"}
            </button>
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 ${
                  currentPage === page
                    ? "bg-gray-200 font-bold"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              {">"}
            </button>
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-r disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              {">>"}
            </button>
          </div>

          {showHistory && selectedItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-lg sm:max-w-4xl max-h-[90%] overflow-y-auto p-4 sm:p-6 relative">
                <button
                  onClick={() => setShowHistory(false)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 text-lg sm:text-xl font-bold text-gray-600 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#2B5279]">
                  ประวัติ: {selectedItem.name}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border text-xs sm:text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          เลขที่ยืม
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          ชื่อ-นามสกุล
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          วันที่ยืม
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          กำหนดคืน
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          คืนจริง
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          จำนวน
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          สถานที่ใช้
                        </th>
                        <th className="px-2 py-2 sm:px-3 sm:py-2 border">
                          สถานะ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="border px-2 py-2 sm:px-3 sm:py-2 text-center text-xs sm:text-sm"
                          >
                            ไม่มีประวัติการยืม
                          </td>
                        </tr>
                      ) : (
                        historyData.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              {item.id}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2">
                              {item.name}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              {item.borrowDate
                                ? new Date(item.borrowDate).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              {item.dueDate
                                ? new Date(item.dueDate).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              {item.returnDate
                                ? new Date(item.returnDate).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              {item.quantity}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              {item.place}
                            </td>
                            <td className="border px-2 py-2 sm:px-3 sm:py-2 text-center">
                              <span
                                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm whitespace-nowrap ${item.statusColor}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
