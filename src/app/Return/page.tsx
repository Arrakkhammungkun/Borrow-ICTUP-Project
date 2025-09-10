"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { Borrowing, ReturnDetail } from "@/types/borrowing";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
export default function Return() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<Borrowing | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [historyData, setHistoryData] =useState<Borrowing[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [returnDetails, setReturnDetails] = useState<ReturnDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true)

  const itemsPerPage = 5;

  const fetchData = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/borrowings?type=owner&status=RETURNED,BORROWED${search ? `&search=${search}` : ""}`
      );
      if (res.ok) {
        const json = await res.json();
        setHistoryData(
          json.map((item) => ({
            ...item,
            quantity: item.details.reduce(
              (sum, d) => sum + d.quantityBorrowed,
              0
            ),
          }))
        );
      } else {
        console.error("Failed to fetch data");
        setHistoryData([]);
      }
    } catch (error) {
      console.error(error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(searchTerm);
  };

  const getStatusThai = (status :string) => {
    switch (status) {
      case "PENDING":
        return "รออนุมัติ";
      case "APPROVED":
        return "อนุมัตแล้ว";
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

  const getStatusColor = (status :string) => {
    switch (status) {
      case "RETURNED":
        return "bg-[#25B99A] text-white";
      case "REJECTED":
        return "bg-[#E74C3C] text-white";
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

  const formatThaiDate = (isoDate) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const paginatedData = historyData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const openModal = (item) => {
    setSelectedItem(item);
    setReturnDetails(
      item.details.map((d) => ({
        detailId: d.id,
        complete: 0,
        incomplete: 0,
        lost: 0,
      }))
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setReturnDetails([]);
  };

  const updateReturnDetail = (  
    index: number,
  field: keyof ReturnDetail,
  value: string
  ):void => {
    if (!selectedItem) return;
    const borrowed = selectedItem.details[index].quantityBorrowed;
    const rd = returnDetails[index];
    let sumOthers = 0;
    if (field !== "complete") sumOthers += rd.complete || 0;
    if (field !== "incomplete") sumOthers += rd.incomplete || 0;
    if (field !== "lost") sumOthers += rd.lost || 0;
    const maxVal = borrowed - sumOthers;
    const newValue = Math.min(Math.max(0, parseInt(value) || 0), maxVal);
    setReturnDetails((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: newValue } : r
      )
    );
  };

  const handleConfirmReturn = async () => {
    // Validate sums
    let valid = true;
    if (!selectedItem) return;
    selectedItem.details.forEach((detail, index) => {
      const rd = returnDetails[index];
      const totalReturned = (rd.complete || 0) + (rd.incomplete || 0) + (rd.lost || 0);
      if (totalReturned !== detail.quantityBorrowed) {
        valid = false;
      }
    });

    if (!valid) {
      Swal.fire("ข้อผิดพลาด!", "จำนวนรวมต้องเท่ากับจำนวนที่ยืมสำหรับทุกรายการ", "error");
      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันการคืน?",
      text: "คุณต้องการยืนยันการคืนอุปกรณ์นี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/borrowings/return", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            borrowingId: selectedItem.id,
            returnDetails,
          }),
        });

        if (res.ok) {
          await Swal.fire("สำเร็จ!", "คืนอุปกรณ์เรียบร้อยแล้ว", "success");
          closeModal();
          fetchData(searchTerm);
        } else {
          const errorData = await res.json();
          Swal.fire("ผิดพลาด!", errorData.error || "Failed to return", "error");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในการคืน", "error");
      }
    }
  };
  const getDaysLeft = (dueDate: string | null, status: string): string => {
    if (!dueDate || status !== "BORROWED") return ""; // ถ้าไม่มี dueDate หรือ status ไม่ใช่ BORROWED
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // แปลงเป็นจำนวนวัน
    return diffDays >= 0 ? `(กำหนดส่งคืนอีก ${diffDays} วัน)` : `เลยกำหนด ${-diffDays} วัน`;
  };
  const getDaysLeftColor = (status: string): string => {
    switch (status) {
      case "OVERDUE":
        return "text-red-500";   // เลยกำหนด
      case "BORROWED":
        return "text-[#28A745]"; // อยู่ระหว่างยืม
      default:
        return "text-gray-500";  // รายการอื่น
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <h1 className="text-2xl font-bold text-[#4682B4]">รับคืน</h1>
          </div>

          <div className="flex justify-end flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <input
              type="text"
              className="border border-gray-300 px-4 py-1 rounded w-full sm:w-64"
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="bg-[#25B99A] text-white px-3 py-1 rounded hover:bg-teal-600 w-full sm:w-auto"
              onClick={handleSearch}
            >
              ค้นหา
            </button>
          </div>
    
          {loading ? (
            <div className="text-center">กำลังโหลด...</div>
          ) : historyData.length === 0 ? (
            <div className="text-center">ไม่พบข้อมูล</div>
          ) : (
            <div className="border rounded overflow-x-auto bg-white ">
              <table className="min-w-full table-auto text-sm border border-gray-200">
                <thead className="bg-[#2B5279] text-white text-sm ">
                  <tr>
                    <th className="px-4 py-2 text-left border-r">เลขใบยืม</th>
                    <th className="px-4 py-2 text-center border-r">วันที่ยืม</th>
                    <th className="px-4 py-2 text-center border-r">กำหนดวันส่งคืน</th>
                    <th className="px-4 py-2 text-left border-r">ชื่อผู้ยืม</th>
                    <th className="px-4 py-2 text-center border-r">จำนวน</th>
                    <th className="px-4 py-2 text-center border-r">สถานะ</th>
                    <th className="px-4 py-2 text-center">เพิ่มเติม</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, i) => (
                    <tr key={i} className="border-t text-sm">
                      <td className="px-4 py-3 border-r text-left">{item.id}</td>
                      <td className="px-4 py-3 border-r text-center">
                        {formatThaiDate(item.requestedStartDate)}
                      </td>
                      <td className="px-4 py-3 border-r text-center">
                        {formatThaiDate(item.dueDate)}
                        <div className={`text-sm ${getDaysLeftColor(item.status)}`}>
                          {getDaysLeft(item.dueDate, item.status)}
                        </div>
                      </td>


                      <td className="px-4 py-3 border-r text-left">{item.borrowerName}</td>
                      <td className="px-4 py-3 border-r text-center">{item.quantity}</td>
                      <td className="px-4 py-3 border-r text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusThai(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status !== "RETURNED" && (
                          <button
                            className="bg-[#25B99A] text-white gap-2 px-3 py-1 rounded hover:bg-[#1a6152] whitespace-nowrap"
                            onClick={() => openModal(item)}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} size="lg" />
                            รับคืน
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                  currentPage === page ? "bg-gray-200 font-bold" : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="px-2 py-1 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50 ">
          <div className="bg-white  dark:text-black rounded-lg shadow-lg w-[90%] max-w-4xl p-6 relative overflow-auto">
            <h2 className="text-xl font-bold text-center text-[#2B5279] mb-4">
              รายละเอียดการคืนอุปกรณ์ (เลขใบยืม: {selectedItem.id})
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="text-center font-semibold bg-[#2B5279] text-white">
                    <th className="border px-3 py-2 w-12">ที่</th>
                    <th className="border px-3 py-2">รหัสอุปกรณ์</th>
                    <th className="border px-3 py-2">ชื่ออุปกรณ์</th>
                    <th className="border px-3 py-2 w-20">จำนวนที่ยืม</th>
                    <th className="border px-3 py-2 w-24">คืนสมบูรณ์</th>
                    <th className="border px-3 py-2 w-24">คืนไม่สมบูรณ์</th>
                    <th className="border px-3 py-2 w-24">หาย</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {selectedItem.details?.map((detail, index) => {
                    const borrowed = detail.quantityBorrowed;
                    const rd = returnDetails[index] || { complete: 0, incomplete: 0, lost: 0 };
                    const maxComplete = borrowed - (rd.incomplete + rd.lost);
                    const maxIncomplete = borrowed - (rd.complete + rd.lost);
                    const maxLost = borrowed - (rd.complete + rd.incomplete);
                    return (
                      <tr key={index}>
                        <td className="border px-2 py-2">{index + 1}</td>
                        <td className="border px-2 py-2">{detail.equipment.equipment_id}</td>
                        <td className="border px-2 py-2 text-left">{detail.equipment.name}</td>
                        <td className="border px-2 py-2">{detail.quantityBorrowed}</td>
                        <td className="border px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max={maxComplete}
                            value={rd.complete}
                            onChange={(e) =>
                              updateReturnDetail(index, "complete", e.target.value)
                            }
                            className="w-full text-center border rounded px-1 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max={maxIncomplete}
                            value={rd.incomplete}
                            onChange={(e) =>
                              updateReturnDetail(index, "incomplete", e.target.value)
                            }
                            className="w-full text-center border rounded px-1 py-1"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max={maxLost}
                            value={rd.lost}
                            onChange={(e) =>
                              updateReturnDetail(index, "lost", e.target.value)
                            }
                            className="w-full text-center border rounded px-1 py-1"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={handleConfirmReturn}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                ยืนยันการคืน
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                ยกเลิก
              </button>
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