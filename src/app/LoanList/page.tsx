"use client";
import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function Equipmentlist() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 5;

  const historyData = [
    {
      id: "11025",
      name: "ศาสตราจารย์ ดร. อารักษ์ คำบุญคง",
      borrowDate: "26/7/2572",
      dueDate: "26/7/2572",
      quantity: "3",
      status: "รออนุมัติ",
      statusColor: "bg-[#87CEEB] text-white",
      items: [
        {
          name: "MINDS: โปรเจกเตอร์ (ยืมแล้ว 20 วัน) : ดร.อารักษ์ คำบุญคง",
          quantity: 1,
        },
        {
          name: "MINDS: กล้อง DSLR (ยืมแล้ว 25 วัน) : ดร.อารักษ์ คำบุญคง",
          quantity: 2,
        },
      ],
    },
    {
      id: "11026",
      name: "ศาสตราจารย์ ดร. อารักษ์ คำบุญคง",
      borrowDate: "26/7/2572",
      dueDate: "26/7/2572",
      quantity: "7",
      status: "อยู่ระหว่างยืม",
      statusColor: "bg-[#2ECC71] text-white",
      items: [
        {
          name: "MINDS: โปรเจกเตอร์ (ยืมแล้ว 20 วัน) : ดร.อารักษ์ คำบุญคง",
          quantity: 3,
        },
        {
          name: "MINDS: กล้อง DSLR (ยืมแล้ว 25 วัน) : ดร.อารักษ์ คำบุญคง",
          quantity: 4,
        },
      ],
    },
    // เพิ่มข้อมูล mock ได้ตามต้องการ...
  ];

  const paginatedData = historyData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const openModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <h1 className="text-2xl font-bold text-[#4682B4]">
              รายการยืมปัจจุบัน
            </h1>
          </div>

          <div className="flex justify-end flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <input
              type="text"
              className="border border-gray-300 px-4 py-1 rounded w-full sm:w-64"
              placeholder="เลขใบยืม"
            />
            <button className="bg-[#25B99A] text-white px-3 py-1 rounded hover:bg-teal-600 w-full sm:w-auto">
              ค้นหา
            </button>
          </div>

          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white text-sm">
                <tr>
                  <th className="px-4 py-2 text-left border-r">เลขใบยืม</th>
                  <th className="px-4 py-2 text-center border-r">วันที่ยืม</th>
                  <th className="px-4 py-2 text-center border-r">กำหนดวันส่งคืน</th>
                  <th className="px-4 py-2 text-left border-r">ชื่อเจ้าของ</th>
                  <th className="px-4 py-2 text-center border-r">จำนวน</th>
                  <th className="px-4 py-2 text-center border-r">สถานะ</th>
                  <th className="px-4 py-2 text-center">เพิ่มเติม</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, i) => (
                  <tr key={i} className="border-t text-sm">
                    <td className="px-4 py-3 border-r text-left">{item.id}</td>
                    <td className="px-4 py-3 border-r text-center">{item.borrowDate}</td>
                    <td className="px-4 py-3 border-r text-center">{item.dueDate}</td>
                    <td className="px-4 py-3 border-r text-left">{item.name}</td>
                    <td className="px-4 py-3 border-r text-center">{item.quantity}</td>
                    <td className="px-4 py-3 border-r text-center">
                      <span className={`px-2 py-1 rounded text-xs ${item.statusColor}`}>
                        {item.status}
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl p-6 relative">
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
                  {selectedItem.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-2">{index + 1}</td>
                      <td className="border px-2 py-2 text-left">{item.name}</td>
                      <td className="border px-2 py-2">{item.quantity}</td>
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
