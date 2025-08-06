"use client";
import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

const mockData = [
  { id: 1, code: "001", name: "อุปกรณ์ไฟฟ้า", owner: "นายสมชาย", quantity: 1 },
  { id: 2, code: "002", name: "สาย HDMI", owner: "นางสาวสาวิตรี", quantity: 5 },
  { id: 3, code: "003", name: "โปรเจคเตอร์", owner: "นายประวิทย์", quantity: 2 },
  { id: 4, code: "004", name: "ไมโครโฟน", owner: "นางสาวพิมพ์ใจ", quantity: 3 },
  { id: 5, code: "005", name: "กล้องถ่ายรูป", owner: "นายสมชาย", quantity: 1 },
];

export default function Equipmentlist() {
  const [borrowItems, setBorrowItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);

  // กรองข้อมูลเมื่อพิมพ์
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length === 0) {
      setFilteredResults([]);
      return;
    }

    const results = mockData.filter(
      (item) =>
        item.code.includes(term) ||
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.owner.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredResults(results);
  };

  // เมื่อคลิกเลือกจาก dropdown
  const handleSelectItem = (item) => {
    

    // ป้องกันเพิ่มรายการซ้ำ (ถ้าต้องการ)
    if (borrowItems.find((i) => i.code === item.code)) {
      alert("รายการนี้ถูกเลือกแล้ว");
      setSearchTerm("");
      setFilteredResults([]);
      return;
    }

    // เพิ่มรายการใหม่ โดยเพิ่ม id ใหม่
    const newItem = { ...item, id: Date.now() };
    setBorrowItems([...borrowItems, newItem]);

    // ล้างช่องค้นหาและ dropdown
    setSearchTerm("");
    setFilteredResults([]);
  };

  const handleDelete = (id) => {
    setBorrowItems(borrowItems.filter((item) => item.id !== id));
  };

  const handleCancelAll = () => {
    setBorrowItems([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-2xl font-bold text-[#4682B4] mb-4">สร้างรายการยืม</h1>

          {/* แสดง div นี้เมื่อมีรายการใน borrowItems */}
          {borrowItems.length > 0 && (
            <div className="bg-[#F5F5F5] border-[#DCDCDC] p-4 rounded-md mb-4">
              <div className="flex gap-2 justify-between">
                <p className="text-center p-2">คุณได้เลือก {borrowItems.length} รายการ</p>
                <div className="flex gap-2">
                  <button className="bg-[#25B99A] hover:bg-[#1E6F5C] text-white px-4 rounded">
                    สร้างฟอร์ม
                  </button>
                  <button
                    onClick={handleCancelAll}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 rounded"
                  >
                    ยกเลิกรายการ
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative w-80 mb-4">
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              placeholder="รหัส / ชื่ออุปกรณ์ / ชื่อเจ้าของ"
              value={searchTerm}
              onChange={handleSearchChange}
              autoComplete="off"
            />
            {filteredResults.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-auto mt-1 shadow-lg">
                {filteredResults.map((item) => (
                  <li
                    key={item.id}
                    className="p-2 hover:bg-blue-200 cursor-pointer"
                    onClick={() => handleSelectItem(item)}
                  >
                    {item.code} - {item.name} ({item.owner})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto mt-6">
            <p>รายการที่ต้องการยืมทั้งหมด</p>
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-[#2B5279] text-white text-left">
                  <th className="p-2 border">ที่</th>
                  <th className="p-2 border">รหัส</th>
                  <th className="p-2 border">รายการ</th>
                  <th className="p-2 border">เจ้าของ</th>
                  <th className="p-2 border">จำนวน</th>
                  <th className="p-2 border text-center">#</th>
                </tr>
              </thead>
              <tbody>
                {borrowItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border">{item.code}</td>
                    <td className="p-2 border">{item.name}</td>
                    <td className="p-2 border">{item.owner}</td>
                    <td className="p-2 border">{item.quantity} ชิ้น</td>
                    <td className="p-2 border text-center space-x-2">
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
                {borrowItems.length === 0 && (
                  <tr>
                    <td className="p-2 border text-center" colSpan="6">
                      ยังไม่มีรายการที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
