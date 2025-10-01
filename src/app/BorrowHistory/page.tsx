"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { Borrowing } from "@/types/borrowing";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPrint } from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
import Swal from "sweetalert2";

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
  >(null);

  const fetchHistory = async (search = "") => {
    setLoading(true);
    try {
      const url = `/api/borrowings?type=borrower&status=RETURNED,REJECTED${search ? `&search=${search}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("failed to fetch History");
      const data = await res.json();
      setHistory(data);
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
      fetchHistory();
    }
  }, [searchTerm]);

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
    setSelectedReturnCondition(null);
  };

  const getStatusThai = (status: string) => {
    switch (status) {
      case "PENDING": return "รออนุมัติ";
      case "APPROVED": return "อยู่ระหว่างยืม";
      case "REJECTED": return "ไม่อนุมัติ";
      case "BORROWED": return "ยืมแล้ว";
      case "RETURNED": return "ส่งคืนแล้ว";
      case "OVERDUE": return "เลยกำหนด";
      default: return status;
    }
  };

  const getConditionThai = (condition?: string) => {
    if (!condition) return "-";
    // ทำให้ฟังก์ชันนี้เป็นเพียงตัวแสดงผลที่สม่ำเสมอ
    // ไม่ว่าข้อมูลใน DB จะเป็นอังกฤษหรือไทย ก็จะแสดงผลเป็นไทย
    switch (condition) {
      case "NORMAL": case "สมบูรณ์": return "สมบูรณ์";
      case "SLIGHTLY_DAMAGED": case "ไม่สมบูรณ์": return "ไม่สมบูรณ์";
      case "DAMAGED": case "ชำรุด": return "ชำรุด";
      case "LOST": case "สูญหาย": return "สูญหาย";
      default: return condition;
    }
  };

  const getStatusColor = (status: string, returnStatusColor?: string) => {
    if (status === "RETURNED" && returnStatusColor) {
      switch (returnStatusColor) {
        case "green": return "bg-green-100 text-green-800";
        case "yellow": return "bg-yellow-100 text-yellow-800";
        case "red": return "bg-red-100 text-red-800";
        default: return "bg-gray-500 text-white";
      }
    }
    switch (status) {
      case "RETURNED": return "bg-[#25B99A] text-white";
      case "REJECTED": return "bg-[#E5E7EB] text-[#364153]";
      case "PENDING": return "bg-yellow-500 text-white";
      case "APPROVED": case "BORROWED": return "bg-[#4684BC] text-white";
      case "OVERDUE": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const handleDownload = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/pdf/print-return-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ borrowingId: id }),
      });
      if (!res.ok) {
        setLoading(false);
        throw new Error("เกิดข้อผิดพลาดในการโหลดไฟล์ pdf");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `return_evidence_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setLoading(false);
      closeModal();
    } catch (error) {
      setLoading(false);
      console.error("Download error:", error);
      Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในการดาวน์โหลด PDF กรุณาลองใหม่อีกครั้ง", "error");
      closeModal();
    }
  };

  const canPrint = (status: string) => ["RETURNED", "OVERDUE"].includes(status);

  const getFilteredDetails = () => {
    if (!selectedItem) return [];
    if (selectedReturnCondition === null) {
      return selectedItem.details;
    }
    return selectedItem.details.filter(
      (detail) => detail.returnHistories?.[0]?.condition === selectedReturnCondition
    );
  };
  const filteredDetails = getFilteredDetails();

  // แก้ไข: เปลี่ยน value ให้เป็นภาษาไทยเพื่อให้ตรงกับข้อมูลใน DB และ API
  const conditionFilters = [
    { label: "ทั้งหมด", value: null },
    { label: "สมบูรณ์", value: "สมบูรณ์" },
    { label: "ไม่สมบูรณ์", value: "ไม่สมบูรณ์" }, // ใส่ไว้เผื่ออนาคต
    { label: "ชำรุด", value: "ชำรุด" },
    { label: "สูญหาย", value: "สูญหาย" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
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
                onClick={() => setSelectedStatus(status === "ALL" ? null : status)}
                className={`flex items-center gap-1 px-3 py-1 rounded ${
                  (selectedStatus === null && status === "ALL") || selectedStatus === status
                    ? "text-[#996000]"
                    : "text-gray-800 hover:text-[#996000] cursor-pointer"
                }`}
              >
                <span>{status === "ALL" ? "ทั้งหมด" : getStatusThai(status)}</span>
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
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-r">เลขใบยืม</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">วันที่ยืม</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">กำหนดวันส่งคืน</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-r">ชื่อเจ้าของ</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">จำนวน</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">สถานะ</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">เพิ่มเติม</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 border text-center text-gray-500">ไม่มีรายการ</td></tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-left">{item.id}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">{item.requestedStartDate ? new Date(item.requestedStartDate).toLocaleDateString("th-TH") : "-"}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("th-TH") : "-"}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-left">{item.ownerName || "-"}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">{item.details?.reduce((sum, d) => sum + d.quantityBorrowed, 0) || 0}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                        <span className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${getStatusColor(item.status, item.returnStatusColor)}`}>
                          {getStatusThai(item.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                        <button className="text-lg sm:text-xl px-2 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={() => openModal(item)}>≡</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center mt-6 select-none text-[#25B99A]">
            <button className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-l border-gray-300 disabled:opacity-30" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>{"<<"}</button>
            <button className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>{"<"}</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (<button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 ${currentPage === page ? "bg-gray-200 font-bold" : "hover:bg-gray-100"}`}>{page}</button>))}
            <button className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>{">"}</button>
            <button className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-r disabled:opacity-30" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>{">>"}</button>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl lg:max-w-4xl p-4 sm:p-6 relative dark:text-black">
            <h2 className="text-lg sm:text-xl font-bold text-center text-[#2B5279] mb-4">รายละเอียดประวัติการยืมครุภัณฑ์</h2>
            <hr className="border-[#3333] my-2" />
            <div className="w-full flex flex-col sm:flex-row sm:justify-between p-2 gap-4">
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">เลขใบยืม :</span> {selectedItem.id}</p>
                <p><span className="font-semibold">ชื่อผู้ขอยืม:</span> {selectedItem.borrower_firstname} {selectedItem.borrower_lastname}</p>
                <p><span className="font-semibold">ตำแหน่ง:</span> {selectedItem.borrower_position}</p>
                <p><span className="font-semibold">เพื่อใช้ในงาน:</span> {selectedItem.details[0]?.note || "-"}</p>
                <p><span className="font-semibold">คณะ/กอง/ศูนย์:</span> {selectedItem.details[0]?.department || "-"}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">วันที่ยืม :</span> {selectedItem.requestedStartDate ? new Date(selectedItem.requestedStartDate).toLocaleDateString("th-TH") : "-"}</p>
                <p><span className="font-semibold">ถึงวันที่ :</span> {selectedItem.borrowedDate ? new Date(selectedItem.borrowedDate).toLocaleDateString("th-TH") : "-"}</p>
                <p><span className="font-semibold">กำหนดวันคืน :</span> {selectedItem.dueDate ? new Date(selectedItem.dueDate).toLocaleDateString("th-TH") : "-"}</p>
                <p><span className="font-semibold">วันที่คืนจริง:</span> {selectedItem.returnedDate ? new Date(selectedItem.returnedDate).toLocaleDateString("th-TH") : "-"}</p>
                <p><span className="font-semibold">สถานที่นำไปใช้:</span> {selectedItem.location}</p>
              </div>
            </div>
            <hr className="border-[#3333] my-2" />
             <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-4 text-sm">
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

            <div className="mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="font-semibold">รายการที่ยืม</span>
              {selectedItem.status === "RETURNED" && (
                <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm justify-start sm:justify-end">
                  {conditionFilters.map((filter) => {
                    const count = filter.value === null
                      ? selectedItem.details.length
                      : selectedItem.details.filter(d => d.returnHistories?.[0]?.condition === filter.value).length;

                    return (
                      <button
                        key={filter.label}
                        onClick={() => setSelectedReturnCondition(filter.value)}
                        className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer ${
                          selectedReturnCondition === filter.value
                            ? "text-[#996000]"
                            : "text-gray-800 hover:text-[#996000]"
                        }`}
                      >
                        <span>{filter.label}</span>
                        <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-[#2B5279] text-white">
                  <tr className="text-center font-semibold">
                    <th className="border-x border-black px-3 py-2 w-12">ที่</th>
                    <th className="border-x border-black px-3 py-2">รายการ</th>
                    <th className="border-x border-black px-3 py-2">หมายเลขพัสดุ/ครุภัณฑ์</th>
                    <th className="border-x border-black px-3 py-2">สภาพหลังคืน</th>
                    <th className="border-x border-black px-3 py-2">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {filteredDetails.length > 0 ? (
                    filteredDetails.map((detail, index) => (
                      <tr key={detail.id || index}>
                        <td className="border px-3 py-2">{index + 1}</td>
                        <td className="border px-3 py-2 text-left">{detail.equipment.name}</td>
                        <td className="border px-3 py-2">{detail.equipmentInstance.serialNumber}</td>
                        <td className="border px-3 py-2">
                          {getConditionThai(detail.returnHistories?.[0]?.condition)}
                        </td>
                        <td className="border px-3 py-2 text-left">{detail.returnHistories?.[0]?.note || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border p-4 text-center text-gray-500">
                        ไม่พบรายการตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="my-2 text-sm"><span className="font-semibold">หมายเหตุเพิ่มเติม :</span> <p className="inline-block text-gray-700 ml-2">{selectedItem.returnNote || "-"}</p></div>
            <div className="mt-4 flex justify-end">
              {canPrint(selectedItem.status) && (
                <button
                  onClick={() => handleDownload(selectedItem.id)}
                  className="bg-[#347AB7] hover:bg-[#356c9c] font-bold text-white px-3 h-10 rounded flex items-center gap-2 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPrint} /> พิมพ์
                </button>
              )}
            </div>
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl cursor-pointer">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
