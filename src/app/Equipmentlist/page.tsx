"use client";
import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function Equipmentlist() {
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ข้อมูลรายการอุปกรณ์ (10 รายการ)
  const equipmentData = [
    {
      code: "66023001",
      name: "กล้อง DSLR",
      category: "เครื่องใช้ไฟฟ้า",
      status: "ยืมได้",
      location: "ห้อง A1",
      all: 100,
      used: 20,
      available: 70,
      broken: 5,
      lost: 5,
      unit: "ตัว",
    },
    {
      code: "66023002",
      name: "ไมโครโฟน",
      category: "เครื่องเสียง",
      status: "อยู่ระหว่างยืม",
      location: "ห้อง A2",
      all: 50,
      used: 30,
      available: 10,
      broken: 5,
      lost: 5,
      unit: "ตัว",
    },
    {
      code: "66023003",
      name: "โปรเจคเตอร์",
      category: "อุปกรณ์ฉายภาพ",
      status: "ยืมได้",
      location: "ห้อง A3",
      all: 10,
      used: 5,
      available: 4,
      broken: 0,
      lost: 1,
      unit: "เครื่อง",
    },
    {
      code: "66023004",
      name: "โน้ตบุ๊ค",
      category: "คอมพิวเตอร์",
      status: "งดการยืม",
      location: "ห้อง A4",
      all: 30,
      used: 15,
      available: 10,
      broken: 5,
      lost: 0,
      unit: "เครื่อง",
    },
    {
      code: "66023005",
      name: "สาย HDMI",
      category: "สายสัญญาณ",
      status: "ยืมได้",
      location: "ห้อง A5",
      all: 100,
      used: 20,
      available: 75,
      broken: 3,
      lost: 2,
      unit: "เส้น",
    },
    {
      code: "66023006",
      name: "กล้อง WebCam",
      category: "อุปกรณ์ต่อพ่วง",
      status: "เลิกใช้งาน",
      location: "ห้อง A6",
      all: 40,
      used: 0,
      available: 0,
      broken: 40,
      lost: 0,
      unit: "ตัว",
    },
    {
      code: "66023007",
      name: "ไมโครคอนโทรลเลอร์",
      category: "ชิ้นส่วนอิเล็กทรอนิกส์",
      status: "ยืมได้",
      location: "ห้อง A7",
      all: 60,
      used: 30,
      available: 30,
      broken: 0,
      lost: 0,
      unit: "บอร์ด",
    },
    {
      code: "66023008",
      name: "จอมอนิเตอร์",
      category: "จอภาพ",
      status: "อยู่ระหว่างยืม",
      location: "ห้อง A8",
      all: 20,
      used: 10,
      available: 8,
      broken: 1,
      lost: 1,
      unit: "จอ",
    },
    {
      code: "66023009",
      name: "แฟลชไดร์ฟ",
      category: "เก็บข้อมูล",
      status: "ยืมได้",
      location: "ห้อง A9",
      all: 200,
      used: 50,
      available: 140,
      broken: 5,
      lost: 5,
      unit: "อัน",
    },
    {
      code: "66023010",
      name: "ลำโพง",
      category: "เครื่องเสียง",
      status: "ยืมได้",
      location: "ห้อง A10",
      all: 25,
      used: 10,
      available: 12,
      broken: 2,
      lost: 1,
      unit: "คู่",
    },
  ];

  // คำนวณหน้าทั้งหมดและแยกข้อมูลตามหน้า
  const totalPages = Math.ceil(equipmentData.length / itemsPerPage);
  const paginatedEquipment = equipmentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ข้อมูลประวัติ (แสดงใน Modal)
  const historyData = [
    {
      id: "11025",
      name: "ศาสตราจารย์ ดร. อารักษ์ คำบุญคง",
      borrowDate: "01/07/2572",
      dueDate: "05/07/2572",
      returnDate: "04/07/2572",
      quantity: "10",
      place: "ห้องประชุมกลาง",
      status: "รับคืนแล้ว",
      statusColor: "bg-emerald-500 text-white",
    },
    {
      id: "11026",
      name: "นางสาว ศิริพร ไชยวงค์",
      borrowDate: "03/07/2572",
      dueDate: "06/07/2572",
      returnDate: "-",
      quantity: "5",
      place: "คณะวิทยาการคอมฯ",
      status: "อยู่ระหว่างยืม",
      statusColor: "bg-blue-500 text-white",
    },
    {
      id: "11027",
      name: "นาย ทศพร วงศ์กาฬสินธุ์",
      borrowDate: "04/07/2572",
      dueDate: "10/07/2572",
      returnDate: "-",
      quantity: "3",
      place: "ลานกิจกรรม",
      status: "รออนุมัติ",
      statusColor: "bg-yellow-400 text-black",
    },
    {
      id: "11028",
      name: "นางสาว พิมพ์ลภัส พูนสุข",
      borrowDate: "05/07/2572",
      dueDate: "08/07/2572",
      returnDate: "08/07/2572",
      quantity: "8",
      place: "ห้องเรียน 510",
      status: "รับคืนแล้ว",
      statusColor: "bg-emerald-500 text-white",
    },
    {
      id: "11029",
      name: "นาย ธีรภัทร หงส์ทอง",
      borrowDate: "06/07/2572",
      dueDate: "10/07/2572",
      returnDate: "-",
      quantity: "2",
      place: "ศูนย์กิจกรรม",
      status: "อยู่ระหว่างยืม",
      statusColor: "bg-blue-500 text-white",
    },
    {
      id: "11030",
      name: "อาจารย์ ดร. จิราภรณ์ สุขเกษม",
      borrowDate: "02/07/2572",
      dueDate: "07/07/2572",
      returnDate: "07/07/2572",
      quantity: "6",
      place: "คณะนิติศาสตร์",
      status: "รับคืนแล้ว",
      statusColor: "bg-emerald-500 text-white",
    },
    {
      id: "11031",
      name: "นาย สถาพร แสงใส",
      borrowDate: "07/07/2572",
      dueDate: "11/07/2572",
      returnDate: "-",
      quantity: "4",
      place: "ห้องสมุดกลาง",
      status: "รออนุมัติ",
      statusColor: "bg-yellow-400 text-black",
    },
    {
      id: "11032",
      name: "นางสาว ปวีณา ทองมี",
      borrowDate: "08/07/2572",
      dueDate: "12/07/2572",
      returnDate: "12/07/2572",
      quantity: "7",
      place: "อาคารวิทยบริการ",
      status: "รับคืนแล้ว",
      statusColor: "bg-emerald-500 text-white",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1 mt-16">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          {/* แถวบนสุด: หัวข้อและปุ่มเพิ่มรายการ */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <h1 className="text-2xl font-bold text-[#4682B4]">รายการอุปกรณ์</h1>
            <button className="bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-teal-600 w-full md:w-auto">
              เพิ่มรายการ
            </button>
          </div>

          {/* แถวค้นหา */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <input
              type="text"
              className="border border-gray-300 px-4 py-1 rounded w-full sm:w-64"
              placeholder="รายการ"
            />
            <button className="bg-[#25B99A] text-white px-3 py-1 rounded hover:bg-teal-600 w-full sm:w-auto">
              ค้นหา
            </button>
          </div>

          {/* Tabs สถานะ */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm justify-end">
            {["ยืมได้", "อยู่ระหว่างยืม", "งดการยืม", "เลิกใช้งาน"].map(
              (status) => (
                <div key={status} className="flex items-center gap-1">
                  <span>{status}</span>
                  <span className="bg-gray-200 text-gray-800 px-2 rounded-full text-xs">
                    1
                  </span>
                </div>
              )
            )}
          </div>

          {/* ตารางอุปกรณ์ */}
          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white">
                <tr>
                  <th className="px-4 py-2 text-left border-r">รายการ</th>
                  <th className="px-4 py-2 text-center border-r">
                    จำนวนทั้งหมด
                  </th>
                  <th className="px-4 py-2 text-center border-r">
                    รออนุมัติ/อยู่ระหว่างยืม
                  </th>
                  <th className="px-4 py-2 text-center border-r">
                    จำนวนที่ยืมได้
                  </th>
                  <th className="px-4 py-2 text-center border-r">ไม่สมบูรณ์</th>
                  <th className="px-4 py-2 text-center border-r">สูญหาย</th>
                  <th className="px-4 py-2 text-center">หน่วยนับ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipment.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 align-top border-r">
                      <div>
                        <div>รหัส {item.code}</div>
                        <div>ชื่อ : {item.name}</div>
                        <div>หมวดหมู่ : {item.category}</div>
                        <div>
                          สถานะ :{" "}
                          <span
                            className={`${
                              item.status === "ยืมได้"
                                ? "text-green-600"
                                : item.status === "อยู่ระหว่างยืม"
                                  ? "text-blue-600"
                                  : item.status === "งดการยืม"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div>สถานที่เก็บ : {item.location}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs">
                            ✏️ แก้ไข
                          </button>
                          <button
                            className="bg-gray-300 px-3 py-1 rounded text-xs hover:bg-gray-400"
                            onClick={() => setShowHistory(true)}
                          >
                            📈 ประวัติยืมคืน
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      {item.all}
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      {item.used}
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      {item.available}
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      {item.broken}
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      {item.lost}
                    </td>
                    <td className="px-4 py-3 text-center">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ปุ่มเปลี่ยนหน้า */}
          <div className="flex items-center justify-center  mt-6 select-none text-[#25B99A]">
            {/* ปุ่มไปหน้าแรก */}
            <button
              className="px-2 py-1 border rounded-l border-gray-300 disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              {"<<"}
            </button>

            {/* ปุ่มก่อนหน้า */}
            <button
              className="px-2 py-1 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              {"<"}
            </button>

            {/* แสดงเลขหน้า */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border border-gray-300  ${
                  currentPage === page
                    ? "bg-gray-200 font-bold"
                    : "hover:bg-gray-100 "
                }`}
              >
                {page}
              </button>
            ))}

            {/* ปุ่มหน้าถัดไป */}
            <button
              className="px-2 py-1 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              {">"}
            </button>

            {/* ปุ่มไปหน้าสุดท้าย */}
            <button
              className="px-2 py-1 border border-gray-300 rounded-r disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              {">>"}
            </button>
          </div>

          {/* Modal แสดงประวัติ */}
          {showHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-5xl max-h-[90%] overflow-y-auto p-6 relative">
                {/* ปุ่มปิด Modal */}
                <button
                  onClick={() => setShowHistory(false)}
                  className="absolute top-2 right-3 text-lg font-bold text-gray-600 hover:text-black"
                >
                  ✕
                </button>
                <h2 className="text-xl font-bold mb-4">ประวัติ</h2>
                <div className="mb-4 text-sm">
                  <p>รหัส 66023085</p>
                  <p>ชื่อ : กล้องดิจิตอล</p>
                  <p>หมวดหมู่ : เครื่องใช้ไฟฟ้า</p>
                  <p>
                    สถานะ : <span className="text-green-600">ยืมได้</span>
                  </p>
                  <p>สถานที่เก็บ : ห้องสาขา SE</p>
                  <p>จำนวนที่ยืมได้ : 100 ชิ้น</p>
                  <p>หน่วย : ชิ้น</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-2 py-2 border">เลขที่ยืม</th>
                        <th className="px-2 py-2 border">ชื่อ-นามสกุล</th>
                        <th className="px-2 py-2 border">วันที่ยืม</th>
                        <th className="px-2 py-2 border">กำหนดวันส่งคืน</th>
                        <th className="px-2 py-2 border">วันที่ส่งคืน</th>
                        <th className="px-2 py-2 border">จำนวน</th>
                        <th className="px-2 py-2 border">สถานที่ใช้</th>
                        <th className="px-2 py-2 border">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="border px-2 py-1 text-center">
                            {item.id}
                          </td>
                          <td className="border px-2 py-1">{item.name}</td>
                          <td className="border px-2 py-1 text-center">
                            {item.borrowDate}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {item.dueDate}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {item.returnDate}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {item.quantity}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {item.place}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs ${item.statusColor}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
