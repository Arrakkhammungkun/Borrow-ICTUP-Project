"use client";
import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Borrowing, ReturnDetail } from "@/types/borrowing";

export default function Return() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<Borrowing | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<Borrowing[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [returnDetails, setReturnDetails] = useState<ReturnDetail[]>([]);
  const [returnNote, setReturnNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({ status: "" });
  const itemsPerPage = 5;

  const fetchData = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/borrowings?type=owner&status=RETURNED,BORROWED,OVERDUE${search ? `&search=${search}` : ""}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const json = await res.json();
        const borrowings = Array.isArray(json) ? json : json.borrowings || [];
        setHistoryData(
          borrowings.map((item: Borrowing) => ({
            ...item,
            quantity: item.details.reduce((sum, d) => sum + d.quantityBorrowed, 0),
          }))
        );
      } else {
        throw new Error("Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ผิดพลาด!", "ไม่สามารถโหลดข้อมูลได้", "error");
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchData();
    }
  }, [searchTerm]);

  const paginatedData = useMemo(() => {
    let filtered = historyData;
    if (selectedStatus) {
      filtered = historyData.filter(item => item.status === selectedStatus);
    }
    return filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [historyData, selectedStatus, currentPage]);

  const totalPages = Math.ceil(
    (selectedStatus
      ? historyData.filter(item => item.status === selectedStatus).length
      : historyData.length) / itemsPerPage
  );

  const handleSearch = () => {
    fetchData(searchTerm);
  };

  const getStatusThai = (status: string) => {
    switch (status) {
      case "PENDING": return "รออนุมัติ";
      case "APPROVED": return "อนุมัติแล้ว";
      case "REJECTED": return "ไม่อนุมัติ";
      case "BORROWED": return "อยู่ระหว่างยืม";
      case "RETURNED": return "รับคืนแล้ว";
      case "OVERDUE": return "เลยกำหนด";
      default: return status;
    }
  };

  const getStatusColor = (status: string, returnStatusColor?: string) => {
    if (status === "RETURNED" && returnStatusColor) {
      switch (returnStatusColor) {
        case "green": return "bg-green-100 text-green-700";
        case "yellow": return "bg-yellow-100 text-yellow-700";
        case "red": return "bg-red-100 text-red-700";
        default: return "bg-gray-500 text-white";
      }
    }
    switch (status) {
      case "RETURNED": return "bg-[#25B99A] text-white";
      case "REJECTED": return "bg-[#E74C3C] text-white";
      case "PENDING": return "bg-yellow-500 text-white";
      case "APPROVED":
      case "BORROWED": return "bg-blue-100 text-blue-700";
      case "OVERDUE": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatThaiDate = (isoDate: string | Date | null | undefined): string => {
    if (!isoDate) return "";
    const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    if (isNaN(date.getTime())) return "";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const getDaysLeft = (dueDate: string | null, status: string): string => {
    if (!dueDate || (status !== "BORROWED" && status !== "OVERDUE")) return "";
    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (status === "BORROWED") {
      return diffDays >= 0 ? `(กำหนดส่งคืนอีก ${diffDays} วัน)` : `เลยกำหนด ${-diffDays} วัน`;
    }
    if (status === "OVERDUE") {
      return `เลยกำหนด ${-diffDays} วัน`;
    }
    return "";
  };

  const getDaysLeftColor = (status: string): string => {
    switch (status) {
      case "OVERDUE": return "text-red-500";
      case "BORROWED": return "text-[#28A745]";
      default: return "text-gray-500";
    }
  };

  const openModal = (item: Borrowing) => {
    setSelectedItem(item);
    const validDetails = item.details.filter(
      d => d.equipmentInstanceId && d.quantityReturned + d.quantityLost < d.quantityBorrowed
    );
    if (validDetails.length === 0) {
      Swal.fire("ไม่มีอุปกรณ์ที่สามารถคืนได้", "อุปกรณ์ทั้งหมดในใบยืมนี้คืนครบแล้วหรือไม่มีข้อมูลชิ้นอุปกรณ์", "warning");
      return;
    }
    setReturnDetails(
      validDetails.map(d => ({
        detailId: d.id,
        condition: "",
        note: ""
      }))
    );
    setReturnNote("");
    setFormData({ status: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsChecked(false);
    setSelectedItem(null);
    setReturnDetails([]);
    setReturnNote("");
    setFormData({ status: "" });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setFormData({ status: newStatus });
    if (newStatus && selectedItem) {
      setReturnDetails(
        returnDetails.map(detail => ({
          ...detail,
          condition: newStatus
        }))
      );
    }
  };

  const updateReturnDetail = (index: number, field: keyof ReturnDetail, value: string): void => {
    setReturnDetails(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
    setFormData({ status: "" }); 
  };

  const handleConfirmReturn = async () => {
    if (!selectedItem) return;

    if (returnDetails.some(rd => !rd.condition)) {
      Swal.fire("ผิดพลาด!", "กรุณาเลือกสภาพสำหรับอุปกรณ์ทุกชิ้น", "error");
      return;
    }

    const invalidDetail = returnDetails.find(rd => {
      const detail = selectedItem.details.find(d => d.id === rd.detailId);
      return !detail || !detail.equipmentInstanceId;
    });
    if (invalidDetail) {
      Swal.fire("ผิดพลาด!", "บางรายการไม่มี equipmentInstanceId", "error");
      return;
    }

    const result = await Swal.fire({
      title: "ยืนยันการคืน?",
      html: "<span style='color:red' class='text-sm'>**คุณได้ตรวจสอบอุปกรณ์ทั้งหมดและยืนยันว่าผู้ยืมได้คืนอุปกรณ์เรียบร้อยแล้ว การกระทำนี้ถือเป็นการยืนยันอย่างเป็นทางการและไม่สามารถแก้ไขได้</span>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#dc3545",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await fetch("/api/borrowings/return", {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            credentials: "include" 
          },
          body: JSON.stringify({
            borrowingId: selectedItem.id,
            returnDetails: returnDetails.map(rd => ({
              equipmentInstanceId: selectedItem.details.find(d => d.id === rd.detailId)!.equipmentInstanceId,
              condition: rd.condition,
              note: rd.note
            })),
            returnNote
          })
        });

        if (!response.ok) {
          setLoading(false);
          const errorData = await response.json();
          throw new Error(errorData.error || "เกิดข้อผิดพลาดในการคืน");
        }
        setLoading(false);
        await Swal.fire("สำเร็จ!", "คืนอุปกรณ์เรียบร้อยแล้ว", "success");
        closeModal();
        fetchData(searchTerm);
      } catch (error) {
        setLoading(false);
        console.error(error);
        Swal.fire("ผิดพลาด!", (error as Error).message || "เกิดข้อผิดพลาดในการคืน", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const summary = useMemo(() => {
    if (!selectedItem) return { total: 0, complete: 0, broken: 0, lost: 0 };

    return returnDetails.reduce(
      (acc, detail) => {
        if (detail.condition === "สมบูรณ์") acc.complete += 1;
        if (detail.condition === "ชำรุด") acc.broken += 1;
        if (detail.condition === "สูญหาย") acc.lost += 1;
        return acc;
      },
      {
        total: returnDetails.length,
        complete: 0,
        broken: 0,
        lost: 0
      }
    );
  }, [returnDetails, selectedItem]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
            <h1 className="text-2xl font-bold text-[#4682B4]">รับคืน</h1>
          </div>
          <hr className="mb-6 border-[#DCDCDC]" />

          {loading && <FullScreenLoader />}
          <div className="flex justify-end flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <input
              type="text"
              className="px-4 py-1 sm:w-64 rounded h-10 w-full border-[#87A9C4] border-2 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4]"
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              className="bg-[#25B99A] text-white px-3 h-10 py-1 rounded hover:bg-teal-600 w-full sm:w-auto cursor-pointer"
              onClick={handleSearch}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
              ค้นหา
            </button>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 text-xs sm:text-sm justify-start sm:justify-end">
            {["ALL", "BORROWED", "RETURNED", "OVERDUE"].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status === "ALL" ? null : status)}
                className={`flex items-center gap-1 px-3 py-1 rounded ${
                  (status === "ALL" && selectedStatus === null) || selectedStatus === status
                    ? "text-[#996000]"
                    : "text-gray-800 hover:text-[#996000] cursor-pointer"
                }`}
              >
                <span>{status === "ALL" ? "ทั้งหมด" : getStatusThai(status)}</span>
                <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
                  {status === "ALL"
                    ? historyData.length
                    : historyData.filter(item => item.status === status).length}
                </span>
              </button>
            ))}
          </div>
          {paginatedData.length === 0 ? (
            <div className="text-center">ไม่พบข้อมูล</div>
          ) : (
            <div className="border rounded overflow-x-auto bg-white">
              <table className="min-w-full table-auto text-sm border border-gray-200">
                <thead className="bg-[#2B5279] text-white text-sm">
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
                      <td className="px-4 py-3 border-r text-center">{formatThaiDate(item.requestedStartDate)}</td>
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
                          className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${getStatusColor(
                            item.status,
                            item.returnStatusColor
                          )}`}
                        >
                          {getStatusThai(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status !== "RETURNED" && (
                          <button
                            className="bg-[#25B99A] text-white gap-2 px-3 py-1 rounded hover:bg-[#1a6152] whitespace-nowrap cursor-pointer"
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
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {showModal && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-6 relative flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold text-center text-[#2B5279] mb-4">
              รายละเอียดการคืนอุปกรณ์ (เลขใบยืม: {selectedItem.id})
            </h2>
            <div className="flex gap-2 mb-4 dark:text-black">
              <p className="">จัดการตรวจสภาพครุภัณฑ์ทั้งหมด</p>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-auto border rounded px-3"
              >
                <option value="">-- เลือก --</option>
                <option value="สมบูรณ์">สมบูรณ์</option>
                <option value="ชำรุด">ชำรุด</option>
                <option value="สูญหาย">สูญหาย</option>
              </select>
            </div>
            <div className="overflow-y-auto max-h-[40vh]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-center font-semibold bg-[#2B5279] text-white">
                    <th className="border-x border-black px-3 py-2 w-12">ที่</th>
                    <th className="border-x border-black px-3 py-2">รหัสอุปกรณ์</th>
                    <th className="border-x border-black px-3 py-2">ชื่ออุปกรณ์</th>
                    <th className="border-x border-black px-3 py-2 w-32">สภาพ</th>
                    <th className="border-x border-black px-3 py-2 w-48">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="text-center dark:text-black">
                  {selectedItem.details
                    .filter(d => d.equipmentInstanceId && d.quantityReturned + d.quantityLost < d.quantityBorrowed)
                    .map((detail, index) => {
                      const rd = returnDetails[index] || { 
                        detailId: detail.id, 
                        condition: "", 
                        note: "" 
                      };
                      return (
                        <tr key={index} >
                          <td className="border px-2 py-2">{index + 1}</td>
                          <td className="border px-2 py-2">{detail.equipmentInstance?.serialNumber || detail.equipment.serialNumber}</td>
                          <td className="border px-2 py-2 text-left">{detail.equipment.name}</td>
                          <td className="border px-2 py-2">
                            <select
                              value={rd.condition}
                              onChange={e => updateReturnDetail(index, "condition", e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value="">-- เลือก --</option>
                              <option value="สมบูรณ์">สมบูรณ์</option>
                              <option value="ชำรุด">ชำรุด</option>
                              <option value="สูญหาย">สูญหาย</option>
                            </select>
                          </td>
                          <td className="border px-2 py-2">
                            <input
                              type="text"
                              value={rd.note}
                              onChange={e => updateReturnDetail(index, "note", e.target.value)}
                              className="w-full text-left border rounded px-1 py-1"
                              placeholder="เพิ่มหมายเหตุ..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm flex flex-col gap-2 dark:text-black">
              <p>
                จำนวนทั้งหมด: <span className="font-semibold">{summary.total}</span>, &nbsp;
                คืนสมบูรณ์: <span className="font-semibold">{summary.complete}</span>, &nbsp;
                คืนไม่สมบูรณ์: <span className="font-semibold">{summary.broken}</span>, &nbsp;
                สูญหาย: <span className="font-semibold">{summary.lost}</span>
              </p>
              <div className="flex items-center gap-2">
                <p>หมายเหตุรวม:</p>
                <input
                  type="text"
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  className="flex-grow text-left border rounded px-2 py-1"
                  placeholder="เพิ่มหมายเหตุโดยรวม..."
                />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirmCheckbox"
                  checked={isChecked}
                  onChange={e => setIsChecked(e.target.checked)}
                  className="mr-2 w-4 h-4 cursor-pointer"
                />
                <p className="text-sm text-red-700 select-none">
                  ฉันได้ตรวจสอบอุปกรณ์ทั้งหมดแล้ว และยืนยันว่าได้รับอุปกรณ์เรียบร้อยแล้ว
                </p>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={handleConfirmReturn}
                  disabled={!isChecked || returnDetails.some(rd => !rd.condition)}
                  className={`px-4 py-2 rounded text-white ${
                    isChecked && !returnDetails.some(rd => !rd.condition)
                      ? "bg-green-500 hover:bg-green-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  ยืนยันการคืน
                </button>
                <button
                  onClick={closeModal}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}