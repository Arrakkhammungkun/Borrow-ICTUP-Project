"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPrint } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { BorrowingStatus, statusConfig } from "@/types/LoanList";
import { Borrowing } from "@/types/borrowing";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function Equipmentlist() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Borrowing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [history, sethistory] = useState<Borrowing[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const getStatusThai = (status: string) => {
    switch (status) {
      case "BORROWED":
        return "อยู่ระหว่างยืม";
      case "OVERDUE":
        return "เลยกำหนด";
      case "PENDING":
        return "รออนุมัติ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      default:
        return status;
    }
  };

  const fetchHistory = async (search?: string) => {
    setLoading(true);
    try {
      const url = search
        ? `/api/borrowings?type=borrower&search=${search}`
        : `/api/borrowings?type=borrower`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("failed to fetch History");

      const data = await res.json();
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
      fetchHistory();
    }
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [history.length, selectedStatus]);

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

  const openModal = (item: Borrowing) => {
    console.log("Selected Item:", item);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
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
      return diffDays >= 0
        ? `(กำหนดส่งคืนอีก ${diffDays} วัน)`
        : `เลยกำหนด ${-diffDays} วัน`;
    }

    if (status === "OVERDUE") {
      return `เลยกำหนด ${-diffDays} วัน`;
    }

    return "";
  };

  const getDaysLeftColor = (status: string): string => {
    switch (status) {
      case "OVERDUE":
        return "text-red-500";
      case "BORROWED":
        return "text-[#28A745]";
      default:
        return "text-gray-500";
    }
  };

  const handleDownload = async (borrowingId?: number) => {
    setLoading(true);
    try {
      const borrowings = await fetch("/api/borrowings?type=borrower", {
        credentials: "include",
      });
      if (!borrowings.ok) {
        const errorData = await borrowings.json();
        setLoading(false);
        throw new Error(errorData.error || "ไม่สามารถดึงข้อมูลการยืมได้: เซิร์ฟเวอร์ไม่ตอบสนอง");
      }

      const data = await borrowings.json();
      let hasApproved = false;
      if (borrowingId) {
        hasApproved = data.some(
          (borrowing: Borrowing) => borrowing.id === borrowingId && borrowing.status === BorrowingStatus.APPROVED
        );
      } else {
        hasApproved = data.some(
          (borrowing: Borrowing) => borrowing.status === BorrowingStatus.APPROVED
        );
      }

      if (hasApproved) {
        const updateRes = await fetch("/api/borrowings/update-status", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: BorrowingStatus.BORROWED, borrowingId }),
        });

        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          setLoading(false);
          throw new Error(errorData.error || "ไม่สามารถอัปเดตสถานะได้");
        }
        await fetchHistory();
        if (selectedItem && hasApproved && borrowingId) {
          setSelectedItem((prev) =>
            prev ? { ...prev, status: BorrowingStatus.BORROWED } : null
          );
        }
      }

      const res = await fetch(`/api/pdf/generate-pdf?borrowingId=${borrowingId}`, { credentials: "include" });
      if (!res.ok) {
        setLoading(false);
        const errorData = await res.json();
        throw new Error(errorData.error || "พิมพ์ได้เฉพาะรายการที่ได้รับการอนุมัติแล้วเท่านั้น");
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = borrowingId ? `แบบฟอร์มขอยืมพัสดุครุภัณฑ์_${borrowingId}.pdf` : "แบบฟอร์มขอยืมพัสดุครุภัณฑ์.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);

      closeModal();
    } catch (err: any) {
      setLoading(false);
      console.error("Error in handleDownload:", {
        message: err.message,
        stack: err.stack,
      });
      Swal.fire("ผิดพลาด!", `${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (borrowingId: number) => {
    const result = await Swal.fire({
      title: "ยืนยันการยกเลิก?",
      text: "คุณต้องการยกเลิกรายการยืมนี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2ECC71",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, ยกเลิก!",
      cancelButtonText: "ไม่",
    });

    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/borrowings/${borrowingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setLoading(false);
        const errorData = await res.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'ไม่สามารถยกเลิกรายการได้');
      }

      await setLoading(false);
      Swal.fire("สำเร็จ!", "ยกเลิกรายการยืมเรียบร้อย", "success");
      fetchHistory();
      closeModal();
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      await Swal.fire("ผิดพลาด!", err.message || "ไม่สามารถยกเลิกรายการได้", "error");
      closeModal();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#4682B4] mb-2">
            รายการยืมปัจจุบัน
          </h1>
          <hr className="mb-6 border-[#DCDCDC]" />
          {loading && <FullScreenLoader />}
          <div className="flex flex-col sm:flex-row sm:justify-start sm:items-center gap-2 mb-4">
            <div className="flex w-full sm:max-w-xs gap-2">
              <input
                type="text"
                className="border-[#87A9C4] border-2 px-3 py-2 rounded w-full h-10 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4] text-sm sm:text-base"
                placeholder="เลขใบยืม"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={handleSearch}
                className="flex-shrink-0 flex items-center justify-center gap-2 bg-[#25B99A] text-white px-3 py-2 rounded hover:bg-[#2d967f] whitespace-nowrap text-xs sm:text-sm cursor-pointer"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                <span>ค้นหา</span>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2 text-xs sm:text-sm justify-center sm:justify-end">
            {["ALL", "PENDING", "APPROVED", "BORROWED", "OVERDUE"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status === "ALL" ? null : status)}
                className={`flex items-center gap-1 px-0 sm:px-3 py-2 rounded cursor-pointer ${
                  (status === "ALL" && selectedStatus === null) || selectedStatus === status
                    ? "text-[#996000] bg-gray-100"
                    : "text-gray-800 hover:text-[#996000] hover:bg-gray-50"
                }`}
              >
                <span>{status === "ALL" ? "ทั้งหมด" : getStatusThai(status)}</span>
                <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {status === "ALL"
                    ? history.length
                    : history.filter((item) => item.status === status).length}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4 p-4">
            {paginatedData.length === 0 ? (
              <div className="text-center text-sm text-gray-500">
                ไม่มีรายการยืม
              </div>
            ) : (
              paginatedData.map((item, i) => (
                <div key={i} className="border rounded-md p-4 bg-gray-50">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">เลขใบยืม:</span> {item.id}
                    </div>
                    <div>
                      <span className="font-semibold">วันที่ยืม:</span>{" "}
                      {item.requestedStartDate
                        ? new Date(item.requestedStartDate).toLocaleDateString()
                        : "-"}
                    </div>
                    <div>
                      <span className="font-semibold">กำหนดวันส่งคืน:</span>{" "}
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : "-"}
                      {item.dueDate && (
                        <div className={`text-xs ${getDaysLeftColor(item.status)}`}>
                          {getDaysLeft(item.dueDate, item.status)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">ชื่อเจ้าของ:</span>{" "}
                      {item.ownerName}
                    </div>
                    <div>
                      <span className="font-semibold">จำนวน:</span>{" "}
                      {item.details?.length}
                    </div>
                    <div>
                      <span className="font-semibold">สถานะ:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          statusConfig[item.status as BorrowingStatus]
                            ?.className || "bg-gray-200"
                        }`}
                      >
                        {statusConfig[item.status as BorrowingStatus]?.label ||
                          item.status}
                      </span>
                    </div>
                    <div className="pt-2">
                      <button
                        className="bg-blue-700 text-white px-3 py-2 rounded hover:bg-blue-800 flex items-center gap-2 text-sm cursor-pointer"
                        onClick={() => openModal(item)}
                      >
                        <span className="text-lg">≡</span>
                        รายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block border rounded overflow-x-auto bg-white">
            <table className="min-w-full text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white text-sm">
                <tr>
                  <th className="px-4 py-3 text-left border-r">เลขใบยืม</th>
                  <th className="px-4 py-3 text-center border-r">วันที่ยืม</th>
                  <th className="px-4 py-3 text-center border-r">กำหนดวันส่งคืน</th>
                  <th className="px-4 py-3 text-left border-r">ชื่อเจ้าของ</th>
                  <th className="px-4 py-3 text-center border-r">จำนวน</th>
                  <th className="px-4 py-3 text-center border-r">สถานะ</th>
                  <th className="px-4 py-3 text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, i) => (
                  <tr key={i} className="border-t text-sm">
                    <td className="px-4 py-3 border-r text-center">{item.id}</td>
                    <td className="px-4 py-3 border-r text-center">
                      {item.requestedStartDate
                        ? new Date(item.requestedStartDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : "-"}
                      {item.dueDate && (
                        <div className={`text-xs ${getDaysLeftColor(item.status)}`}>
                          {getDaysLeft(item.dueDate, item.status)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 border-r text-left">{item.ownerName}</td>
                    <td className="px-4 py-3 border-r text-center">{item.details?.length}</td>
                    <td className="px-4 py-3 border-r text-center">
                      <span
                        className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${
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
                        className="bg-blue-700 text-white px-3 py-2 rounded hover:bg-blue-800 flex items-center gap-2 mx-auto text-sm cursor-pointer"
                        onClick={() => openModal(item)}
                      >
                        <span className="text-lg">≡</span>
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td className="p-3 border text-center text-gray-500" colSpan={7}>
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
              className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-l border-gray-300 disabled:opacity-30 text-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              {"<<"}
            </button>
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30 text-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-sm ${
                  currentPage === page
                    ? "bg-gray-200 font-bold"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30 text-sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              {">"}
            </button>
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-r disabled:opacity-30 text-sm"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[95%] sm:w-[90%] max-w-4xl p-4 sm:p-6 relative flex flex-col max-h-[90vh] dark:text-black">
            <h2 className="text-lg sm:text-xl font-bold text-center text-[#2B5279] mb-4">
              รายละเอียดการยืมครุภัณฑ์
            </h2>
            <hr className="border border-[#3333] my-1" />
            <div className="flex flex-col sm:flex-row justify-between p-1 gap-4">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">เลขใบยืม:</span> {selectedItem.id}
                </p>
                <p>
                  <span className="font-semibold">ชื่อผู้ขอยืม:</span>{" "}
                  {selectedItem.borrower_firstname} {selectedItem.borrower_lastname}
                </p>
                <p>
                  <span className="font-semibold">ตำแหน่ง:</span>{" "}
                  {selectedItem.borrower_position}
                </p>
                <p>
                  <span className="font-semibold">เพื่อใช้ในงาน:</span>{" "}
                  {selectedItem.details[0].note}
                </p>
                <p>
                  <span className="font-semibold">คณะ/กอง/ศูนย์:</span>{" "}
                  {selectedItem.details[0].department}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">วันที่ยืม:</span>{" "}
                  {selectedItem.requestedStartDate
                    ? new Date(selectedItem.requestedStartDate).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">ถึงวันที่:</span>{" "}
                  {selectedItem.borrowedDate
                    ? new Date(selectedItem.borrowedDate).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">กำหนดวันคืน:</span>{" "}
                  {selectedItem.dueDate
                    ? new Date(selectedItem.dueDate).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold">สถานที่นำไปใช้:</span>{" "}
                  {selectedItem.location}
                </p>
              </div>
            </div>
            <hr className="border border-[#3333] my-1" />
            <div className="flex flex-col sm:flex-row justify-between py-2 gap-4">
              <div className="space-y-2 text-sm">
                <span className="font-semibold">ชื่อเจ้าของ:</span>{" "}
                {selectedItem.ownerName}
              </div>
              <div className="space-y-2 text-sm">
                <span className="font-semibold">เบอร์โทร:</span>{" "}
                {selectedItem.details[0].equipment?.owner?.mobilePhone || "-"}
              </div>
            </div>
            <div className="mb-2 text-sm">
              <span className="font-semibold">รายการที่ยืม</span>
            </div>

            {/* Mobile Card Layout for Modal */}
            <div className="block sm:hidden space-y-4 overflow-y-auto max-h-[40vh]">
              {selectedItem.details?.map((detail, index) => (
                <div key={index} className="border rounded-md p-4 bg-gray-50">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">ที่:</span> {index + 1}
                    </div>
                    <div>
                      <span className="font-semibold">รายการ:</span>{" "}
                      {detail.equipment.name}
                    </div>
                    <div>
                      <span className="font-semibold">หมายเลขพัสดุ/ครุภัณฑ์:</span>{" "}
                      {detail.equipmentInstance.serialNumber || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">ที่เก็บ:</span>{" "}
                      {detail.equipmentInstance.location || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">หมายเหตุ:</span>{" "}
                      {detail.equipmentInstance.note || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout for Modal */}
            <div className="hidden sm:block overflow-x-auto max-h-[40vh]">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="text-center font-semibold">
                    <th className="border px-3 py-2 w-12">ที่</th>
                    <th className="border px-3 py-2">รายการ</th>
                    <th className="border px-3 py-2">หมายเลขพัสดุ/ครุภัณฑ์</th>
                    <th className="border px-3 py-2">ที่เก็บ</th>
                    <th className="border px-3 py-2">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {selectedItem.details?.map((detail, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-2">{index + 1}</td>
                      <td className="border px-2 py-2 text-center">{detail.equipment.name}</td>
                      <td className="border px-2 py-2">{detail.equipmentInstance.serialNumber || "-"}</td>
                      <td className="border px-2 py-2">{detail.equipmentInstance.location || "-"}</td>
                      <td className="border px-2 py-2">{detail.equipmentInstance.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
              <button
                onClick={() => handleDownload(selectedItem.id)}
                className="bg-[#347AB7] hover:bg-[#356c9c] text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <FontAwesomeIcon icon={faPrint} size="lg" />
                <span>พิมพ์</span>
              </button>
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="bg-[#E74C3C] text-white px-3 py-2 rounded hover:bg-[#b43c2f] text-sm cursor-pointer"
              >
                ยกเลิกรายการยืม
              </button>
            </div>
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-lg sm:text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}