"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { BorrowingStatus, statusConfig } from "@/types/BorrowingAproval";
import { Borrowing } from "@/types/borrowing";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function BorrowApprovalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Borrowing[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // เพิ่ม state สำหรับหน้า
  const itemsPerPage = 10; // จำนวนรายการต่อหน้า (สอดคล้องกับ Equipmentlist)
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const fetchData = async (search?: string) => {
    setLoading(true);
    try {
      const query = search ? `&search=${search}` : "";
      const res = await fetch(`/api/borrowings?type=owner${query}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // รีเซ็ตข้อมูลเมื่อ searchTerm ว่าง
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchData();
    }
  }, [searchTerm]);

  const handleSearch = () => {
    fetchData(searchTerm.trim());
  };

  const formatThaiDate = (
    isoDate: string | Date | null | undefined
  ): string => {
    if (!isoDate) return "";
    const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    if (isNaN(date.getTime())) return "";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const getStatusThai = (status: string) => {
    switch (status) {
      case "PENDING":
        return "รออนุมัติ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ไม่อนุมัติ";
      case "BORROWED":
        return "อยู่ระหว่างยืม";
      case "RETURNED":
        return "รับคืนแล้ว";
      case "OVERDUE":
        return "เลยกำหนด";
      default:
        return status;
    }
  };

  // กรองข้อมูลเฉพาะสถานะ
  const filteredData = selectedStatus
    ? data.filter((item) => item.status === selectedStatus)
    : data;

  // คำนวณข้อมูลสำหรับการแบ่งหน้า
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // รีเซ็ตหน้าเมื่อข้อมูลที่กรองเปลี่ยนแปลง
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  const pendingCount = data.filter((item) => item.status === "PENDING").length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row p-2 max-w-full overflow-hidden">
        <Sidebar />
        {loading && <FullScreenLoader />}
        <main className="flex-1 p-4 md:p-6 mt-16 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          <h1 className="text-xl md:text-2xl font-bold mb-2 text-[#4682B4]">
            รออนุมัติขอยืม
          </h1>
          <hr className="mb-6 border-[#DCDCDC]" />

          {/* Search */}
          <div className="flex w-full sm:max-w-52 gap-2 mb-4">
            <input
              type="text"
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-[#87A9C4] px-3 py-2 rounded w-full sm:w-64 h-10 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4]"
            />
            <button
              onClick={handleSearch}
              className="flex-shrink-0 flex items-center justify-center gap-2 bg-[#25B99A] text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[#1F9A80] whitespace-nowrap text-xs sm:text-sm cursor-pointer"
            >
              <img src="/Search.png" className="w-4 h-4 sm:w-5 sm:h-5" />
              ค้นหา
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 text-xs sm:text-sm justify-start sm:justify-end">
            {["ALL", "PENDING", "APPROVED", "BORROWED", "OVERDUE"].map(
              (status) => {
                const isSelected =
                  (status === "ALL" && selectedStatus === null) ||
                  selectedStatus === status;

                // กำหนดสีปุ่ม
                let buttonClasses =
                  "flex items-center gap-1 px-3 py-1 rounded cursor-pointer ";

                if (isSelected) {
                  // สีเมื่อเลือก
                  buttonClasses +=
                    status === "PENDING"
                      ? "text-[#996000]"
                      : "text-[#996000]";
                } else {
                  // สีปกติ
                  buttonClasses +=
                    "text-gray-800 hover:text-[#996000]";
                }

                return (
                  <button
                    key={status}
                    onClick={() =>
                      setSelectedStatus(status === "ALL" ? null : status)
                    }
                    className={buttonClasses}
                  >
                    <span>
                      {status === "ALL" ? "ทั้งหมด" : getStatusThai(status)}
                    </span>
                    <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            status === "PENDING" && pendingCount > 0
                              ? "bg-red-500 text-white"
                              : "bg-gray-800 text-white"
                          }`}
                        >
                          {status === "ALL"
                            ? data.length
                            : data.filter((item) => item.status === status).length}
                        </span>
                  </button>
                );
              }
            )}
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="bg-[#2B5279] text-white text-xs sm:text-sm">
                  <th className="p-2 sm:p-3 border">เลขใบยืม</th>
                  <th className="p-2 sm:p-3 border">ชื่อ-นามสกุล</th>
                  <th className="p-2 sm:p-3 border">วันที่ยืม</th>
                  <th className="p-2 sm:p-3 border">กำหนดวันส่งคืน</th>
                  <th className="p-2 sm:p-3 border">สถานะ</th>
                  <th className="p-2 sm:p-3 border">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-2 sm:p-3 border text-center text-gray-500 text-xs sm:text-sm"
                    >
                      ไม่มีรายการยืม
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr
                      key={index}
                      className="text-center text-xs sm:text-sm bg-white"
                    >
                      <td className="p-2 sm:p-3 border">{item.id}</td>
                      <td className="p-2 sm:p-3 border">{item.borrowerName}</td>
                      <td className="p-2 sm:p-3 border">
                        {formatThaiDate(item.requestedStartDate)}
                      </td>
                      <td className="p-2 sm:p-3 border">
                        {formatThaiDate(item.dueDate)}
                      </td>
                      <td className="p-2 sm:p-3 border">
                        <span
                          className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${
                            statusConfig[item.status as BorrowingStatus]
                              ?.className || "bg-gray-200"
                          }`}
                        >
                          {statusConfig[item.status as BorrowingStatus]
                            ?.label || item.status}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 border">
                        <button
                          onClick={() =>
                            router.push(`/Approval-details/${item.id}`)
                          }
                          className="bg-blue-700 text-white px-2 py-1 sm:px-3 sm:py-2 rounded hover:bg-blue-800 shadow cursor-pointer"
                        >
                          
                          <img
                            src="/folder.png"
                            className="w-4 h-4 sm:w-5 sm:h-5 inline-block"
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
        </main>
      </div>
    </div>
  );
}
