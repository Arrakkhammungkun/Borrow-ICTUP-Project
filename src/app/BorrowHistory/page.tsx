"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { Borrowing } from "@/types/borrowing";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function Equipmentlist() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Borrowing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState<Borrowing[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");
  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchHistory = async (search = "")  => {
    setLoading(true);
    try {

      const res = await fetch(`/api/borrowings?type=borrower&status=RETURNED,REJECTED${search ? `&search=${search}` : ""}`
      ,{ credentials: "include" });
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

  const handleSearch = () => {
    fetchHistory(searchTerm);
  };

  // pagination
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
    const getStatusColor = (status: string, returnStatusColor?: string) => {
    if (status === 'RETURNED' && returnStatusColor) {
    switch (returnStatusColor) {
      case 'green':
        return 'bg-[#229954] text-white';
      case 'yellow':
        return 'bg-[#FDCB6E] text-white';
      case 'red':
        return 'bg-[#E74C3C] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }
    switch (status) {
      case "RETURNED":
        return "bg-[#25B99A] text-white";
      case "REJECTED":
        return "bg-[#DCDCDC] text-white";
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

return (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">ประวัติการยืม</h1>
        </div>
        <hr className="mb-6 border-[#DCDCDC]" />

        {/* Search box */}
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
            className="bg-[#25B99A] hover:bg-[#2d967f] font-semibold text-white px-3 py-2 sm:px-4 sm:py-2 rounded flex items-center gap-2 text-sm sm:text-base h-10"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
            ค้นหา
          </button>
        </div>

        {/* Table */}
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
                <tr>
                  <td colSpan={7} className="p-2 sm:p-4 border text-center text-gray-500 text-xs sm:text-sm">
                    ไม่มีรายการ
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="border-t text-xs sm:text-sm">
                    <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-left">{item.id}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                      {item.requestedStartDate
                        ? new Date(item.requestedStartDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-left">
                      {item.ownerName || "-"}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                      {item.details?.reduce((sum, d) => sum + d.quantityBorrowed, 0) || 0}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 border-r text-center">
                      <span
                        className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm whitespace-nowrap ${getStatusColor(
                          item.status,
                          item.returnStatusColor
                        )}`}
                      >
                        {getStatusThai(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                      <button
                        className="text-lg sm:text-xl px-2 py-1 hover:bg-gray-100 rounded"
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
                currentPage === page ? "bg-gray-200 font-bold" : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

    {/* Modal */}
    {showModal && selectedItem && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
        <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-lg sm:max-w-2xl p-4 sm:p-6 relative dark:text-black">
          <h2 className="text-lg sm:text-xl font-bold text-center text-[#2B5279] mb-4">
            รายละเอียดประวัติการยืมครุภัณฑ์
          </h2>
          <hr className="border border-[#3333] my-2" />
          <div className="w-full flex flex-col sm:flex-row sm:justify-between p-2 gap-4">
            <div className="space-y-2">
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
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">สถานที่นำไปใช้:</span>{" "}
                {selectedItem.location}
              </p>
              <p>
                <span className="font-semibold">คณะ/กอง/ศูนย์:</span>{" "}
                {selectedItem.details[0].department}
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
              {selectedItem.details[0].equipment.owner.mobilePhone}
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold">รายการที่ยืม</span>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full text-xs sm:text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr className="text-center font-semibold">
                  <th className="border px-2 py-2 sm:px-3 sm:py-2 w-12">ที่</th>
                  <th className="border px-2 py-2 sm:px-3 sm:py-2">รายการ</th>
                  <th className="border px-2 py-2 sm:px-3 sm:py-2">หมายเลขพัสดุ/ครุภัณฑ์</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {selectedItem.details?.map((detail, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-2 sm:px-3 sm:py-2">{index + 1}</td>
                    <td className="border px-2 py-2 sm:px-3 sm:py-2 text-left">
                      {detail.equipment.name}
                    </td>
                    <td className="border px-2 py-2 sm:px-3 sm:py-2">
                      {detail.equipment.serialNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="my-2">

            <div className="space-y-2"> 
              <div className="my-2">
                <p>
                <span className="font-semibold">รายละเอียดการคืน:</span>{" "}
                              
                 {selectedItem.details[0].conditionAfterReturn}
                 </p>
              </div>
              <div className="my-2">
                <p>
                <span className="font-semibold">หมายเหตุ:</span>{" "}
                              
                  <span >{selectedItem.details[0].returnHistories[0].note || "-"} </span>
                 </p>
              </div>
              
            </div>
          </div>

          <button
            onClick={closeModal}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-500 text-lg sm:text-xl"
          >
            ✕
          </button>
        </div>
      </div>
    )}
  </div>
);
}
