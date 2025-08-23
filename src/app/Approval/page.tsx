"use client";

import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function BorrowApprovalPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const data = [
    {
      id: "11025",
      name: "ศาสตราจารย์ ดร. อารักษ์ คำมุงคุล",
      borrowDate: "26/7/2572",
      returnDate: "26/7/2572",
      status: "รออนุมัติ",
    },
    {
      id: "11025",
      name: "ศาสตราจารย์ ดร. อารักษ์ คำมุงคุล",
      borrowDate: "26/7/2572",
      returnDate: "26/7/2572",
      status: "อยู่ระหว่างยืม",
    },
    {
      id: "11025",
      name: "ศาสตราจารย์ ดร. อารักษ์ คำมุงคุล",
      borrowDate: "26/7/2572",
      returnDate: "26/7/2572",
      status: "อยู่ระหว่างยืม",
    },
    
  ];

  const filteredData = data.filter((item) =>
    item.id.includes(searchTerm)
  );

  // ✅ นับจำนวน "รออนุมัติ"
  const pendingCount = filteredData.filter(
    (item) => item.status === "รออนุมัติ"
  ).length;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 ml-0 mt-16 text-black border rounded-md border-[#3333] bg-gray-50">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-4 text-blue-500">
            รออนุมัติขอยืม
          </h1>
          <hr className="mb-4" />

          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="เลขใบยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-64"
            />
            <button className="flex items-center gap-2 bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-[#1F9A80]">
              <img
              src="/Search.png"
              className="w-5 h-5"
              />
              ค้นหา
            </button>
          </div>

          {/* Table */}
          <div className="relative">
            {/* ✅ Badge แจ้งเตือนเหมือนใน UI */}
            {pendingCount > 0 && (
              <div className="absolute -top-8 right-0 ">
                <span className="bg-red-500 text-white text-sm font-medium px-4 py-1 rounded shadow">
                  รออนุมัติ {pendingCount}
                </span>
              </div>
            )}

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2B5279] text-white">
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
                  <tr key={index} className="text-center bg-white hover:bg-gray-100">
                    <td className="p-2 border">{item.id}</td>
                    <td className="p-2 border">{item.name}</td>
                    <td className="p-2 border">{item.borrowDate}</td>
                    <td className="p-2 border">{item.returnDate}</td>
                    <td className="p-2 border">
                      {item.status === "รออนุมัติ" ? (
                        <span className="bg-red-500 text-white px-3 py-1 rounded">
                          {item.status}
                        </span>
                      ) : (
                        <span className="bg-green-500 text-white px-3 py-1 rounded">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="p-2 border">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow">
                        <img 
                        src="/folder.png"
                        className="w-5 h-5"
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
