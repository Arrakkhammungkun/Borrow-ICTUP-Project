"use client";

import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function BorrowDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // ✅ mock data
  const detail = {
    id: id,
    name: "อารักษ์ คำมุงคุล",
    position: "อาจารย์",
    faculty: "เทคโนโลยีสารสนเทศ",
    borrowDate: "26/7/2568",
    returnDate: "5/8/2568",
    location: "หอประชุมทดลองคำ",
    reason: "เพื่อใช้ในการประชุม",
    items: [
      {
        code: "66023085",
        name: "กล้องถ่ายวิดีโอดิจิตอล",
        qty: 1,
        stock: 630,
        unit: "ชิ้น",
      },
      {
        code: "66023085",
        name: "กล้องถ่ายวิดีโอดิจิตอล",
        qty: 1,
        stock: 630,
        unit: "ชิ้น",
      },
    ],
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 ml-0 mt-16 text-black">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-blue-600">
            รายละเอียด รายการยืมอุปกรณ์
          </h1>

          {/* ✅ Card ข้อมูลผู้ยืม */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 flex flex-col md:flex-row md:justify-between md:gap-20">
            <div className="space-y-2">
              <p>
                <span className="font-semibold">เลขที่ใบยืม :</span> {detail.id}
              </p>
              <p>
                <span className="font-semibold">ชื่อผู้ขอยืม :</span>{" "}
                {detail.name}
              </p>
              <p>
                <span className="font-semibold">ตำแหน่ง :</span>{" "}
                {detail.position}
              </p>
              <p>
                <span className="font-semibold">คณะ/กอง/ศูนย์ :</span>{" "}
                {detail.faculty}
              </p>
            </div>

            <div className="space-y-2 mt-4 md:mt-0">
              <p>
                <span className="font-semibold">วันที่ยืม :</span>{" "}
                {detail.borrowDate}
              </p>
              <p>
                <span className="font-semibold">กำหนดส่งคืน :</span>{" "}
                {detail.returnDate}
              </p>
              <p>
                <span className="font-semibold">สถานที่นำไปใช้ :</span>{" "}
                {detail.location}
              </p>
              <p>
                <span className="font-semibold">หมายเหตุ :</span>{" "}
                {detail.reason}
              </p>
            </div>
          </div>

          {/* ✅ ปุ่ม (Responsive) */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
            <div className="flex gap-3">
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full sm:w-auto">
                อนุมัติยืม
              </button>
              <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full sm:w-auto">
                ไม่อนุมัติ
              </button>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto"
            >
              ย้อนกลับ
            </button>
          </div>

          {/* ✅ ตารางรายการอุปกรณ์ */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-[#2B5279] text-white">
                  <th className="p-2 sm:p-3 border">รหัส</th>
                  <th className="p-2 sm:p-3 border">ชื่ออุปกรณ์</th>
                  <th className="p-2 sm:p-3 border">จำนวนที่ยืม</th>
                  <th className="p-2 sm:p-3 border">หน่วย</th>
                  <th className="p-2 sm:p-3 border">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item, index) => (
                  <tr
                    key={index}
                    className="text-center bg-white hover:bg-gray-100"
                  >
                    <td className="p-2 border">{item.code}</td>
                    <td className="p-2 border text-left">
                      {item.name}
                      <br />
                      <span className="text-xs sm:text-sm text-blue-500">
                        จำนวนที่มีอยู่ในคลัง : {item.stock} {item.unit}
                      </span>
                    </td>
                    <td className="p-2 border">{item.qty}</td>
                    <td className="p-2 border">{item.unit}</td>
                    <td className="p-2 border">{detail.reason}</td>
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
