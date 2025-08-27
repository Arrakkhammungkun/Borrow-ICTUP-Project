"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function BorrowApprovalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const data = [
    {
      id: "244000",
      name: "อารักษ์ คำมุงคุล",
      borrowDate: "26/7/2568",
      returnDate: "5/8/2568",
      status: "รออนุมัติ",
    },
    {
      id: "244001",
      name: "อารักษ์ คำมุงคุล",
      borrowDate: "26/7/2568",
      returnDate: "5/8/2568",
      status: "กำลังยืม",
    },
  ];

  const filteredData = data.filter((item) => item.id.includes(searchTerm));
  const pendingCount = filteredData.filter(
    (item) => item.status === "รออนุมัติ"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 mt-16 text-black border rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-blue-500">
            รออนุมัติขอยืม
          </h1>
          <hr className="mb-4" />

          {/* Search */}
          <div className="flex w-full max-w-52 gap-2 mb-4">
            <input
              type="text"
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button className="flex-shrink-0 flex items-center justify-center gap-2 bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-[#1F9A80] whitespace-nowrap">
              <img src="/Search.png" className="w-5 h-5" />
              ค้นหา
            </button>
          </div>

          {/* Pending badge */}
          {pendingCount > 0 && (
            <div className="mb-2 flex justify-end">
              <span className="bg-red-500 text-white text-xs md:text-sm font-medium px-3 md:px-4 py-1 rounded shadow">
                รออนุมัติ {pendingCount}
              </span>
            </div>
          )}

          {/* Responsive Table */}
          <div className="overflow-x-hidden">
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="bg-[#2B5279] text-white text-sm md:text-base">
                  <th className="p-2 border">เลขใบยืม</th>
                  <th className="p-2 border">ชื่อ-นามสกุล</th>
                  <th className="p-2 border">วันที่ยืม</th>
                  <th className="p-2 border">กำหนดวันส่งคืน</th>
                  <th className="p-2 border">สถานะ</th>
                  <th className="p-2 border">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className="text-center text-xs sm:text-sm md:text-base bg-white hover:bg-gray-100"
                  >
                    <td className="p-1 sm:p-2 border">{item.id}</td>
                    <td className="p-1 sm:p-2 border">{item.name}</td>
                    <td className="p-1 sm:p-2 border">{item.borrowDate}</td>
                    <td className="p-1 sm:p-2 border">{item.returnDate}</td>
                    <td className="p-1 sm:p-2 border">
                      <span
                        className={`text-white text-xs sm:text-sm px-1 sm:px-2 py-0.5 rounded ${
                          item.status === "รออนุมัติ"
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-1 sm:p-2 border">
                      <button
                        onClick={() =>
                          router.push(`/Approval-details/${item.id}`)
                        }
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 shadow"
                      >
                        <img
                          src="/folder.png"
                          className="w-4 h-4 sm:w-5 sm:h-5 inline-block"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
