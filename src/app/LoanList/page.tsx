"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPrint } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

type Equipment = {
  equipment_id: number;
  name: string;
  serialNumber: string;
  category: string;
  description: string;
};

type BorrowingDetail = {
  id: number;
  borrowingId: number;
  equipmentId: number;
  approvalStatus: string;
  approvedAt: string | null;
  approvedById: number | null;
  conditionAfterReturn: string | null;
  createdAt: string;
  updatedAt: string;
  note: string | null;
  quantityBorrowed: number;
  quantityReturned: number;
  equipment: Equipment;
};

type Borrowing = {
  id: number;
  borrowerId: number;
  borrowedDate: string | null;
  dueDate: string;
  returnedDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  requestedStartDate: string;
  details: BorrowingDetail[];
};

export enum BorrowingStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  BORROWED = "BORROWED",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE",
}

const statusConfig: Record<
  BorrowingStatus,
  { label: string; className: string }
> = {
  [BorrowingStatus.PENDING]: {
    label: "กำลังรออนุมัติ",
    className: "bg-[#87CEEB] text-white",
  },
  [BorrowingStatus.APPROVED]: {
    label: "อนุมัติแล้ว",
    className: "bg-[#2ECC71] text-white",
  },
  [BorrowingStatus.REJECTED]: {
    label: "ถูกปฏิเสธ",
    className: "bg-[#E74C3C] text-white",
  },
  [BorrowingStatus.BORROWED]: {
    label: "ยืมออกไปแล้ว",
    className: "bg-yellow-500 text-black",
  },
  [BorrowingStatus.RETURNED]: {
    label: "คืนแล้ว",
    className: "bg-[#229954] text-white",
  },
  [BorrowingStatus.OVERDUE]: {
    label: "เกินกำหนด",
    className: "bg-orange-600 text-white",
  },
};
export default function Equipmentlist() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Borrowing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [history, sethistory] = useState<Borrowing[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = async (search?: string) => {
    try {
      const url = search
        ? `/api/borrowings?type=borrower&search=${search}`
        : `/api/borrowings?type=borrower`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("failed to fetch History");

      const data = await res.json();
      console.log(data);
      sethistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);
  useEffect(() => {
    if (searchTerm.trim() === "") {
      console.log("fech work");
      fetchHistory(); //
    }
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [history.length]);

  const handleSearch = () => {
    fetchHistory(searchTerm.trim());
  };

  const paginatedData = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(history.length / itemsPerPage);

  const openModal = (item: Borrowing) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };


  const handleDownloadAll = async () => {
    try {
      const res = await fetch("/api/pdf/my-approved", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "approved_borrowings.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Failed to download PDF", "error");
    }
  };
  const handlePreviewAll = async () => {
    try {
      const res = await fetch("/api/pdf/my-approved", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // เปิด PDF ในแท็บใหม่
      window.open(url, "_blank");

      // ไม่ต้อง revoke ทันที ถ้า revoke จะปิด URL
      // URL.revokeObjectURL(url);
    } catch (err) {
      console.error("เกิดข้อผิดพลาด ",err)
      Swal.fire("Error", "Failed to preview PDF", "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-2xl font-bold text-[#4682B4] mb-2">
            รายการยืมปัจจุบัน
          </h1>
          <hr className="mb-6 border-[#DCDCDC]" />

          <div className="flex justify-end flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <div className="">
              <button
                onClick={handlePreviewAll}
                className="bg-[#347AB7] hover:bg-[#356c9c] font-bold text-white px-3 h-10 sm:px-3 rounded flex items-center gap-1 text-sm sm:text-base"
              >
                <FontAwesomeIcon icon={faPrint} size="lg" />
                <span>พิมพ์</span>
              </button>
            </div>
            <input
              type="text"
              className="border border-gray-300 px-4 py-1 rounded w-full sm:w-64 h-10 "
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="bg-[#25B99A] hover:bg-[#2d967f] font-bold text-white px-3 h-10 sm:px-3 rounded flex items-center gap-1 text-sm sm:text-base "
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
              <span>ค้นหา</span>
            </button>
          </div>

          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full  text-xs sm:text-sm divide-y divide-black">
              <thead className="bg-[#2B5279] text-white text-sm ">
                <tr className=" divide-x divide-black">
                  <th className="px-4 py-2 text-left border-r">เลขใบยืม</th>
                  <th className="px-4 py-2 text-center border-r">วันที่ยืม</th>
                  <th className="px-4 py-2 text-center border-r">
                    กำหนดวันส่งคืน
                  </th>
                  <th className="px-4 py-2 text-left border-r">ชื่อเจ้าของ</th>
                  <th className="px-4 py-2 text-center border-r">จำนวน</th>
                  <th className="px-4 py-2 text-center border-r">สถานะ</th>
                  <th className="px-4 py-2 text-center">เพิ่มเติม</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, i) => (
                  <tr key={i} className="border-t text-sm">
                    <td className="px-4 py-3 border-r text-center">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 border-r text-left">
                      {item.requestedStartDate
                        ? new Date(item.requestedStartDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 border-r text-left">
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 border-r text-left">
                      {item.ownerName}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {item.details[0]?.quantityBorrowed}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      <span
                        className={`px-4  py-3 rounded text-xs whitespace-nowrap ${
           
                          statusConfig[item.status as BorrowingStatus]
                            ?.className || "bg-gray-200"
                        }`}
                      >
                        {statusConfig[item.status as BorrowingStatus]?.label ||
                          item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="text-xl px-2 py-1 hover:bg-gray-100 rounded"
                        onClick={() => openModal(item)}
                      >
                        ≡
                      </button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td className="p-2 border text-center" colSpan={7}>
                      ไม่มีรายการยืม
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl p-6 relative dark:text-black">
            <h2 className="text-xl font-bold text-center text-[#2B5279] mb-4">
              รายละเอียดการยืมครุภัณฑ์
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="text-center font-semibold">
                    <th className="border px-3 py-2 w-12">ที่</th>
                    <th className="border px-3 py-2">รายการ</th>
                    <th className="border px-3 py-2 w-20">จำนวน</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {selectedItem.details?.map((detail, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-2">{index + 1}</td>
                      <td className="border px-2 py-2 text-left">
                        {detail.equipment.name}
                      </td>
                      <td className="border px-2 py-2">
                        {detail.quantityBorrowed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}