"use client";

import React, { useEffect, useState } from "react";

import Sidebar from "@/components/SideBar";

import Navbar from "@/components/Navbar";

import { Borrowing } from "@/types/borrowing";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faMagnifyingGlass, faPrint } from "@fortawesome/free-solid-svg-icons";

import FullScreenLoader from "@/components/FullScreenLoader";

// ข้อมูลจำลองสำหรับทดสอบ UI
const mockHistoryData: Borrowing[] = [
  {
    id: 2024001,
    borrower_id: "user001",
    borrower_firstname: "สมชาย",
    borrower_lastname: "ใจดี",
    borrower_position: "นักวิชาการคอมพิวเตอร์",
    owner_id: "owner01",
    ownerName: "สำนักงาน A",
    requestedStartDate: "2024-07-20T10:00:00.000Z",
    borrowedDate: "2024-07-21T10:00:00.000Z",
    dueDate: "2024-07-28T17:00:00.000Z",
    returnedDate: "2024-07-27T15:30:00.000Z",
    status: "RETURNED",
    location: "ห้องประชุม 1",
    returnStatusColor: "green",
    details: [
      {
        id: 101,
        borrowingId: 2024001,
        equipmentId: "EQ001",
        quantityBorrowed: 1,
        note: "ใช้สำหรับการนำเสนองานประจำเดือน",
        department: "ฝ่ายเทคโนโลยีสารสนเทศ",
        conditionAfterReturn:
          "อุปกรณ์อยู่ในสภาพสมบูรณ์ ไม่มีร่องรอยความเสียหาย",
        equipment: {
          id: "EQ001",
          name: "Projector EPSON EB-X41",
          serialNumber: "SN-P-112233",
          owner: { mobilePhone: "081-123-4567" },
        },
        returnHistories: [
          {
            id: 201,
            borrowingDetailId: 101,
            returnedDate: "2024-07-27T15:30:00.000Z",
            condition: "NORMAL",
            note: "คืนก่อนกำหนด 1 วัน",
          },
        ],
      },
    ],
  },
  {
    id: 2024002,
    borrower_id: "user002",
    borrower_firstname: "มานี",
    borrower_lastname: "มีนา",
    borrower_position: "เจ้าหน้าที่บุคคล",
    owner_id: "owner02",
    ownerName: "สำนักงาน B",
    requestedStartDate: "2024-07-15T09:00:00.000Z",
    borrowedDate: null,
    dueDate: null,
    returnedDate: null,
    status: "REJECTED",
    location: "ห้องอบรม",
    returnStatusColor: undefined,
    details: [
      {
        id: 102,
        borrowingId: 2024002,
        equipmentId: "EQ002",
        quantityBorrowed: 1,
        note: "ใช้สำหรับอบรมพนักงานใหม่",
        department: "ฝ่ายทรัพยากรบุคคล",
        conditionAfterReturn: null,
        equipment: {
          id: "EQ002",
          name: "Laptop Dell Vostro",
          serialNumber: "SN-L-445566",
          owner: { mobilePhone: "082-234-5678" },
        },
        returnHistories: [],
      },
    ],
  },
  {
    id: 2024003,
    borrower_id: "user001",
    borrower_firstname: "สมชาย",
    borrower_lastname: "ใจดี",
    borrower_position: "นักวิชาการคอมพิวเตอร์",
    owner_id: "owner03",
    ownerName: "สำนักงาน C",
    requestedStartDate: "2024-06-10T11:00:00.000Z",
    borrowedDate: "2024-06-11T11:00:00.000Z",
    dueDate: "2024-06-18T17:00:00.000Z",
    returnedDate: "2024-06-20T10:00:00.000Z",
    status: "RETURNED",
    location: "นอกสถานที่ - งาน Event ตึก Q",
    returnStatusColor: "yellow",
    details: [
      {
        id: 103,
        borrowingId: 2024003,
        equipmentId: "EQ003",
        quantityBorrowed: 1,
        note: "ใช้สำหรับออกบูธประชาสัมพันธ์",
        department: "ฝ่ายการตลาด",
        conditionAfterReturn: "ตัวเครื่องมีรอยขีดข่วนเล็กน้อย แต่ใช้งานได้ปกติ",
        equipment: {
          id: "EQ003",
          name: "ไมโครโฟนไร้สาย Shure",
          serialNumber: "SN-M-778899",
          owner: { mobilePhone: "083-345-6789" },
        },
        returnHistories: [
          {
            id: 203,
            borrowingDetailId: 103,
            returnedDate: "2024-06-20T10:00:00.000Z",
            condition: "SLIGHTLY_DAMAGED",
            note: "คืนเลยกำหนด 2 วัน เนื่องจากติดภารกิจด่วน",
          },
        ],
      },
    ],
  },
  {
    id: 2024005,
    borrower_id: "user004",
    borrower_firstname: "สุดา",
    borrower_lastname: "พรหมดี",
    borrower_position: "กราฟิกดีไซเนอร์",
    owner_id: "owner04",
    ownerName: "สำนักงาน D",
    requestedStartDate: "2024-05-01T09:00:00.000Z",
    borrowedDate: "2024-05-02T09:00:00.000Z",
    dueDate: "2024-05-10T17:00:00.000Z",
    returnedDate: "2024-05-15T11:20:00.000Z",
    status: "RETURNED",
    location: "ฝ่ายออกแบบ",
    returnStatusColor: "red",
    details: [
      {
        id: 105,
        borrowingId: 2024005,
        equipmentId: "EQ005",
        quantityBorrowed: 1,
        note: "ใช้ทำงานกราฟิกสำหรับโปรเจกต์ X",
        department: "ฝ่ายออกแบบ",
        conditionAfterReturn: "อะแดปเตอร์ชำรุด ไม่สามารถใช้งานได้",
        equipment: {
          id: "EQ005",
          name: "Tablet Wacom Intuos Pro",
          serialNumber: "SN-T-665544",
          owner: { mobilePhone: "084-456-7890" },
        },
        returnHistories: [
          {
            id: 205,
            borrowingDetailId: 105,
            returnedDate: "2024-05-15T11:20:00.000Z",
            condition: "DAMAGED",
            note: "ผู้ยืมแจ้งว่าอะแดปเตอร์เสียระหว่างใช้งาน จะรับผิดชอบค่าเสียหาย",
          },
        ],
      },
    ],
  },
  {
    id: 2024006, // รายการใหม่ที่มีสถานะ LOST
    borrower_id: "user005",
    borrower_firstname: "เก่ง",
    borrower_lastname: "กล้าหาญ",
    borrower_position: "นักวิเคราะห์ข้อมูล",
    owner_id: "owner05",
    ownerName: "สำนักงาน E",
    requestedStartDate: "2024-07-25T09:00:00.000Z",
    borrowedDate: "2024-07-26T09:00:00.000Z",
    dueDate: "2024-08-01T17:00:00.000Z",
    returnedDate: "2024-08-01T10:00:00.000Z",
    status: "RETURNED",
    location: "ฝ่ายวิจัย",
    returnStatusColor: "red",
    details: [
      {
        id: 106,
        borrowingId: 2024006,
        equipmentId: "EQ006",
        quantityBorrowed: 1,
        note: "ใช้สำหรับเก็บข้อมูลภาคสนาม",
        department: "ฝ่ายวิจัย",
        conditionAfterReturn: "อุปกรณ์สูญหาย",
        equipment: {
          id: "EQ006",
          name: "กล้องถ่ายภาพ Sony Alpha",
          serialNumber: "SN-C-998877",
          owner: { mobilePhone: "085-567-8901" },
        },
        returnHistories: [
          {
            id: 206,
            borrowingDetailId: 106,
            returnedDate: "2024-08-01T10:00:00.000Z",
            condition: "LOST",
            note: "ผู้ยืมแจ้งว่าทำหายระหว่างใช้งาน จะรับผิดชอบค่าเสียหาย",
          },
        ],
      },
    ],
  },
  {
    id: 2024010,
    borrower_id: "user010",
    borrower_firstname: "ชูชาติ",
    borrower_lastname: "รุ่งเรือง",
    borrower_position: "เจ้าหน้าที่ฝ่ายพัฒนา",
    owner_id: "owner10",
    ownerName: "สำนักงาน IT",
    requestedStartDate: "2024-08-01T09:00:00.000Z",
    borrowedDate: "2024-08-02T09:00:00.000Z",
    dueDate: "2024-08-09T17:00:00.000Z",
    returnedDate: "2024-08-08T15:30:00.000Z",
    status: "RETURNED",
    location: "ห้องประชุมใหญ่",
    returnStatusColor: "green",
    details: Array.from({ length: 10 }, (_, i) => ({
      id: 110 + i,
      borrowingId: 2024010,
      equipmentId: `EQ${10 + i}`,
      quantityBorrowed: 1,
      note: `อุปกรณ์สำหรับนำเสนอชิ้นที่ ${i + 1}`,
      department: "ฝ่ายพัฒนา",
      conditionAfterReturn: `อุปกรณ์อยู่ในสภาพสมบูรณ์`,
      equipment: {
        id: `EQ${10 + i}`,
        name: `โน้ตบุ๊ก HP รุ่น ${100 + i}`,
        serialNumber: `SN-HP-00${10 + i}`,
        owner: { mobilePhone: "089-111-2222" },
      },
      returnHistories: [
        {
          id: 300 + i,
          borrowingDetailId: 110 + i,
          returnedDate: `2024-08-08T15:30:0${i}Z`,
          condition:
            i % 3 === 0
              ? "NORMAL"
              : i % 3 === 1
                ? "SLIGHTLY_DAMAGED"
                : "DAMAGED",
          note:
            i % 3 === 0 ? "สมบูรณ์" : i % 3 === 1 ? "มีรอยเล็กน้อย" : "ชำรุด",
        },
      ],
    })),
  },
];

const getConditionThai = (condition: string | undefined | null) => {
  switch (condition) {
    case "NORMAL":
      return "สมบูรณ์";
    case "SLIGHTLY_DAMAGED":
    case "DAMAGED":
      return "ไม่สมบูรณ์";
    case "LOST":
      return "สูญหาย";
    default:
      return "-";
  }
};

export default function BorrowHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Borrowing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedReturnCondition, setSelectedReturnCondition] = useState<
    string | null
  >(null); // State สำหรับการ filter ใน modal

  const fetchHistory = async (search = "") => {
    setLoading(true);
    setTimeout(() => {
      let data = mockHistoryData;
      if (search) {
        data = mockHistoryData.filter((item) =>
          item.id.toString().includes(search)
        );
      }
      setHistory(data);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = () => {
    fetchHistory(searchTerm.trim());
  };

  const filteredData = selectedStatus
    ? history.filter((item) => item.status === selectedStatus)
    : history;

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  const openModal = (item: Borrowing) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setSelectedReturnCondition(null); // Reset filter state when closing modal
  };

  const getStatusThai = (status: string) => {
    switch (status) {
      case "PENDING":
        return "รออนุมัติ";
      case "APPROVED":
        return "อยู่ระหว่างยืม";
      case "REJECTED":
        return "ไม่อนุมัติ";
      case "BORROWED":
        return "ยืมแล้ว";
      case "RETURNED":
        return "ส่งคืนแล้ว";
      case "OVERDUE":
        return "เลยกำหนด";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string, details?: any[]) => {
    if (status === "RETURNED" && details) {
      // ตรวจสอบว่ามีอุปกรณ์สูญหายหรือไม่
      const hasLost = details.some(
        (detail) => detail.returnHistories?.[0]?.condition === "LOST"
      );
      if (hasLost) {
        return "bg-red-100 text-red-800";
      }

      // ตรวจสอบว่ามีอุปกรณ์ที่เสียหายหรือไม่
      const hasDamaged = details.some((detail) =>
        ["SLIGHTLY_DAMAGED", "DAMAGED"].includes(
          detail.returnHistories?.[0]?.condition
        )
      );
      if (hasDamaged) {
        return "bg-yellow-100 text-yellow-800";
      }

      // ถ้าไม่มีสูญหายหรือเสียหาย แสดงว่าเป็นปกติทั้งหมด
      return "bg-green-100 text-green-800";
    }

    switch (status) {
      case "RETURNED":
        return "bg-[#25B99A] text-white";
      case "REJECTED":
        return "bg-[#E5E7EB] text-[#364153]";
      case "PENDING":
        return "bg-yellow-500 text-white";
      case "APPROVED":
      case "BORROWED":
        return "bg-[#4684BC] text-white";
      case "OVERDUE":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleDownload = async (id: number): Promise<void> => {
    alert(`กำลังจำลองการดาวน์โหลดเอกสารสำหรับใบยืม ID: ${id}`);
    console.log("Simulating PDF download for borrowingId:", id);
  };

  const canPrint = (status: string) => ["RETURNED", "OVERDUE"].includes(status);

  // Filter logic for modal
  const getFilteredDetails = () => {
    if (!selectedItem || selectedReturnCondition === null) {
      return selectedItem?.details || [];
    }

    if (selectedReturnCondition === "NORMAL") {
      return selectedItem.details.filter(
        (detail) => detail.returnHistories?.[0]?.condition === "NORMAL"
      );
    }

    if (selectedReturnCondition === "NOT_NORMAL") {
      return selectedItem.details.filter(
        (detail) =>
          detail.returnHistories?.[0]?.condition !== "NORMAL" &&
          detail.returnHistories?.[0]?.condition !== "LOST"
      );
    }

    if (selectedReturnCondition === "LOST") {
      return selectedItem.details.filter(
        (detail) => detail.returnHistories?.[0]?.condition === "LOST"
      );
    }
    return selectedItem.details;
  };
  const filteredDetails = getFilteredDetails();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          {/* Main content... */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">
              ประวัติการยืม
            </h1>
          </div>
          <hr className="mb-6 border-[#DCDCDC]" />
          {loading && <FullScreenLoader />}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <input
              type="text"
              className="border-2 border-[#87A9C4] px-3 py-2 rounded w-full sm:w-64 h-10 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4]"
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="bg-[#25B99A] hover:bg-[#2d967f] font-semibold text-white px-3 py-2 sm:px-4 sm:py-2 rounded flex items-center gap-2 text-sm sm:text-base h-10 cursor-pointer"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
              ค้นหา
            </button>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 text-xs sm:text-sm justify-start sm:justify-end">
            {["ALL", "RETURNED", "REJECTED"].map((status) => (
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
                <span>
                  {status === "ALL" ? "ทั้งหมด" : getStatusThai(status)}
                </span>
                <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
                  {status === "ALL"
                    ? history.length
                    : history.filter((item) => item.status === status).length}
                </span>
              </button>
            ))}
          </div>
          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full table-auto text-xs sm:text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white text-xs sm:text-sm">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-r">
                    เลขใบยืม
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    วันที่ยืม
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    กำหนดวันส่งคืน
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-r">
                    ชื่อเจ้าของ
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    จำนวน
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    สถานะ
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                    เพิ่มเติม
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-2 sm:p-4 border text-center text-gray-500 text-xs sm:text-sm"
                    >
                      ไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="border-t text-xs sm:text-sm">
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-left">
                        {item.id}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                        {item.requestedStartDate
                          ? new Date(
                              item.requestedStartDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-left">
                        {item.ownerName || "-"}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                        {item.details?.reduce(
                          (sum, d) => sum + d.quantityBorrowed,
                          0
                        ) || 0}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                        <span
                          className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${getStatusColor(item.status, item.details)}`}
                        >
                          {getStatusThai(item.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                        <button
                          className="text-lg sm:text-xl px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => openModal(item)}
                        >
                          ≡
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          <div className="flex items-center justify-center mt-6 select-none text-[#25B99A]">
            <button
              className="px-2 py-1 border rounded-l border-gray-300 disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              {"<<"}
            </button>
            <button
              className="px-2 py-1 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border border-gray-300 ${
                  currentPage === page
                    ? "bg-gray-200 font-bold"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="px-2 py-1 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              {">"}
            </button>
            <button
              className="px-2 py-1 border border-gray-300 rounded-r disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              {">>"}
            </button>
          </div>
        </main>
      </div>

      {/* --- START: Modal with new columns --- */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl lg:max-w-4xl p-4 sm:p-6 relative dark:text-black">
            <h2 className="text-lg sm:text-xl font-bold text-center text-[#2B5279] mb-4">
              รายละเอียดประวัติการยืมครุภัณฑ์
            </h2>
            <hr className="border border-[#3333] my-2" />
            <div className="w-full flex flex-col sm:flex-row sm:justify-between p-2 gap-4">
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">เลขใบยืม :</span>{" "}
                  {selectedItem.id}
                </p>
                <p>
                  <span className="font-semibold">ชื่อผู้ขอยืม:</span>{" "}
                  {selectedItem.borrower_firstname}{" "}
                  {selectedItem.borrower_lastname}
                </p>
                <p>
                  <span className="font-semibold">ตำแหน่ง:</span>{" "}
                  {selectedItem.borrower_position}
                </p>
                <p>
                  <span className="font-semibold">เพื่อใช้ในงาน:</span>{" "}
                  {selectedItem.details[0]?.note || "-"}
                </p>
                <p>
                  <span className="font-semibold">คณะ/กอง/ศูนย์:</span>{" "}
                  {selectedItem.details[0]?.department || "-"}
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">วันที่ยืม :</span>{" "}
                  {selectedItem.requestedStartDate
                    ? new Date(
                        selectedItem.requestedStartDate
                      ).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">ถึงวันที่ :</span>{" "}
                  {selectedItem.borrowedDate
                    ? new Date(selectedItem.borrowedDate).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">กำหนดวันคืน :</span>{" "}
                  {selectedItem.dueDate
                    ? new Date(selectedItem.dueDate).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">วันที่คืนจริง:</span>{" "}
                  {selectedItem.returnedDate
                    ? new Date(selectedItem.returnedDate).toLocaleDateString()
                    : " -"}
                </p>
                <p>
                  <span className="font-semibold">สถานที่นำไปใช้:</span>{" "}
                  {selectedItem.location}
                </p>
              </div>
            </div>
            <hr className="border border-[#3333] my-2 shadow-2xl" />
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-4">
              <div className="space-y-2">
                <span className="font-semibold">ชื่อเจ้าของ:</span>{" "}
                {selectedItem.ownerName}
              </div>
              <div className="space-y-2">
                <span className="font-semibold">เบอร์โทร:</span>{" "}
                {selectedItem.details && selectedItem.details.length > 0
                  ? selectedItem.details[0].equipment.owner.mobilePhone
                  : "-"}
              </div>
            </div>

            
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">รายการที่ยืม</span>
              {selectedItem.status === "RETURNED" && (
                <div className="flex flex-wrap gap-1 sm:gap-2  text-xs sm:text-sm justify-start sm:justify-end">
                  {["ALL", "NORMAL", "NOT_NORMAL", "LOST"].map((condition) => (
                    <button
                      key={condition}
                      onClick={() =>
                        setSelectedReturnCondition(
                          condition === "ALL" ? null : condition
                        )
                      }
                      className={`flex items-center gap-1 px-3 py-1 rounded ${
                        (condition === "ALL" &&
                          selectedReturnCondition === null) ||
                        selectedReturnCondition === condition
                          ? "text-[#996000]"
                          : "text-gray-800 hover:text-[#996000] cursor-pointer"
                      }`}
                    >
                      <span>
                        {condition === "ALL"
                          ? "ทั้งหมด"
                          : condition === "NORMAL"
                            ? "สมบูรณ์"
                            : condition === "NOT_NORMAL"
                              ? "ไม่สมบูรณ์"
                              : "สูญหาย"}
                      </span>
                      <span className="text-gray-800 px-2 py-1 rounded-full text-xs">
                        {condition === "ALL"
                          ? selectedItem.details.length
                          : selectedItem.details.filter(
                              (d) =>
                                (condition === "NORMAL" &&
                                  d.returnHistories?.[0]?.condition ===
                                    "NORMAL") ||
                                (condition === "NOT_NORMAL" &&
                                  (d.returnHistories?.[0]?.condition ===
                                    "SLIGHTLY_DAMAGED" ||
                                    d.returnHistories?.[0]?.condition ===
                                      "DAMAGED")) ||
                                (condition === "LOST" &&
                                  d.returnHistories?.[0]?.condition === "LOST")
                            ).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            

            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-center font-semibold bg-[#2B5279] text-white">
                    <th
                      scope="col"
                      className="border-x  border-black px-3 py-2 w-12"
                    >
                      ที่
                    </th>
                    <th
                      scope="col"
                      className="border-x  border-black px-3 py-2"
                    >
                      รายการ
                    </th>
                    <th
                      scope="col"
                      className="border-x  border-black px-3 py-2"
                    >
                      หมายเลขพัสดุ/ครุภัณฑ์
                    </th>
                    <th
                      scope="col"
                      className="border-x  border-black px-3 py-2"
                    >
                      สภาพ
                    </th>
                    <th
                      scope="col"
                      className="border-x  border-black px-3 py-2"
                    >
                      หมายเหตุ
                    </th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {filteredDetails?.map((detail, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-2 sm:px-3 sm:py-2">
                        {index + 1}
                      </td>
                      <td className="border px-2 py-2 sm:px-3 sm:py-2">
                        {detail.equipment.name}
                      </td>
                      <td className="border px-2 py-2 sm:px-3 sm:py-2">
                        {detail.equipment.serialNumber}
                      </td>
                      <td className="border px-2 py-2 sm:px-3 sm:py-2">
                        {selectedItem.status === "RETURNED"
                          ? getConditionThai(
                              detail.returnHistories?.[0]?.condition
                            )
                          : "-"}
                      </td>
                      <td className="border px-2 py-2 sm:px-3 sm:py-2">
                        {selectedItem.status === "RETURNED"
                          ? detail.returnHistories?.[0]?.note || "-"
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="my-2">
              <span className="font-semibold">หมายเหตุเพิ่มเติม :</span>
              <p className="inline-block text-sm text-gray-700 ml-2">
                {selectedItem.details[0]?.note || "-"}
              </p>
            </div>

            <div className="my-2">
              {canPrint(selectedItem.status) && (
                <div className="gap-2 sm:gap-3 mt-4 flex justify-end">
                  <button
                    onClick={() => handleDownload(selectedItem.id)}
                    className="bg-[#347AB7] hover:bg-[#356c9c] font-bold text-white px-3 h-10 sm:px-3 rounded flex items-center gap-1 text-sm sm:text-base cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faPrint} size="lg" />
                    <span>พิมพ์</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-500 text-lg sm:text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* --- END: Modal --- */}
    </div>
  );
}
