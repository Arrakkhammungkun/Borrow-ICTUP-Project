"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Equipment, EquipmentHistory } from "@/types/equipment";
import Swal from "sweetalert2";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
export default function MyEquipmentList() {
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [historyData, setHistoryData] = useState<EquipmentHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  // โหลดข้อมูลอุปกรณ์ของเจ้าของ
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await fetch("/api/equipments/owner");
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        setEquipmentData(data);
      } catch (error) {
        console.error("โหลดข้อมูลอุปกรณ์ล้มเหลว:", error);
      }
    };
    fetchEquipment();
  }, []);

  useEffect(() => {
    const filtered = equipmentData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEquipment(filtered);
    setCurrentPage(1);
  }, [searchQuery, equipmentData]);

  // แสดงประวัติการยืมคืน
  const handleShowHistory = async (item: Equipment) => {
    try {
      console.log(item.code);
      const res = await fetch(`/api/history/equipments/${item.code}`, {
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        let errorMessage = text;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || text;
        } catch {}
        throw new Error(errorMessage || "Failed to fetch history");
      }
      const history: EquipmentHistory[] = JSON.parse(text);
      setSelectedItem(item);
      setHistoryData(history);
      console.log(history);
      setShowHistory(true);
    } catch (err: any) {
      console.error("โหลดประวัติผิดพลาด", err);
      Swal.fire(
        "ข้อผิดพลาด!",
        err.message || "ไม่สามารถโหลดประวัติได้",
        "error"
      );
    }
  };

  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "ลบข้อมูลหรือไม่?",
      text: "คุณต้องการลบข้อมูลใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/equipments/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("ไม่สามารถลบได้");
        }
        setFilteredEquipment((prev) => prev.filter((item) => item.id !== id));
        await Swal.fire("สำเร็จ!", "ลบข้อมูลสำเร็จ", "success");
      } catch (error) {
        console.error(error);
        await Swal.fire("ข้อผิดพลาด!", "ลบข้อมูลไม่สำเร็จ", "error");
      }
    }
  };
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const csvData = result.data;
        if (csvData.length === 0) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: "ไฟล์ CSV ว่างเปล่า",
            icon: "error",
            draggable: true,
          });
          return;
        }

        // ตรวจสอบ header ว่าครบถ้วน
        const requiredHeaders = [
          "code",
          "name",
          "category",
          "location",
          "status",
          "quantity",
          "unit",
          "description",
          "feature",
        ];
        const headers = Object.keys(csvData[0] as object);
        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        );
        if (missingHeaders.length > 0) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: `ไฟล์ CSV ขาดคอลัมน์: ${missingHeaders.join(", ")}`,
            icon: "error",
            draggable: true,
          });
          return;
        }

        // ตรวจสอบข้อมูลใน CSV
        const formattedData = csvData.map((row: any) => ({
          serialNumber: row.code,
          name: row.name,
          category: row.category,
          storageLocation: row.location,
          status: row.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
          total: Number(row.quantity),
          unit: row.unit,
          description: row.description || "",
          feature: row.feature || "",
        }));

        // ตรวจสอบข้อมูลที่จำเป็น
        const invalidRows = formattedData.filter(
          (row) =>
            !row.serialNumber ||
            !row.name ||
            !row.category ||
            !row.storageLocation ||
            !row.unit ||
            isNaN(row.total) ||
            row.total < 1
        );
        if (invalidRows.length > 0) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: "ข้อมูลใน CSV ไม่ครบถ้วนหรือไม่ถูกต้อง",
            icon: "error",
            draggable: true,
          });
          return;
        }

        try {
          const res = await fetch("/api/AddItem/AdditemCsv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ items: formattedData }),
          });

          const responseJson = await res.json();

          if (!res.ok) {
            throw new Error(
              responseJson?.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล"
            );
          }

          await Swal.fire({
            title: "เพิ่มรายการสำเร็จ!",
            text: `เพิ่ม ${formattedData.length} รายการจาก CSV`,
            icon: "success",
            draggable: true,
          });

          router.push("/Equipmentlist");
        } catch (err: unknown) {
          if (err instanceof Error) {
            Swal.fire({
              title: "เกิดข้อผิดพลาด!",
              text: err.message || "ไม่สามารถเพิ่มรายการได้",
              icon: "error",
              draggable: true,
            });
          } else {
            Swal.fire({
              title: "เกิดข้อผิดพลาด!",
              icon: "error",
              draggable: true,
            });
          }
        }
      },
      error: (error) => {
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: `ไม่สามารถอ่านไฟล์ CSV: ${error.message}`,
          icon: "error",
          draggable: true,
        });
      },
    });

    e.target.value = "";
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          {/* แถวบนสุด */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
            <h1 className="text-2xl font-bold text-[#4682B4]">
              รายการอุปกรณ์ของฉัน
            </h1>
          </div>
          <hr className="mb-6 border-[#DCDCDC]" />
          {/* ค้นหา */}
          <div className="flex justify-between mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 px-4 py-1 rounded w-full sm:w-64"
                placeholder="รายการ"
              />
              <button className="bg-[#25B99A] text-white px-3 py-1 rounded hover:bg-teal-600 w-full sm:w-auto">
                ค้นหา
              </button>
            </div>

            <div>
              <div className="flex space-x-2">
                <Link href={"/AddItem"}>
                  <button
                    type="submit"
                    className="bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    เพิ่มรายการ
                  </button>
                </Link>
                <label
                  htmlFor="csv-upload"
                  className="bg-[#3498DB] text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
                >
                  เพิ่มแบบ CSV
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Tabs สถานะ */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm justify-end">
            {["ยืมได้", "อยู่ระหว่างยืม", "งดการยืม", "เลิกใช้งาน"].map(
              (status) => (
                <div key={status} className="flex items-center gap-1">
                  <span>{status}</span>
                  <span className="bg-gray-200 text-gray-800 px-2 rounded-full text-xs">
                    {
                      equipmentData.filter((item) => item.status === status)
                        .length
                    }
                  </span>
                </div>
              )
            )}
          </div>

          {/* ตารางรายการอุปกรณ์ */}
          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full table-auto text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white">
                <tr>
                  <th className="px-4 py-2 text-left border-r">รายการ</th>
                  <th className="px-4 py-2 text-center border-r">ทั้งหมด</th>
                  <th className="px-4 py-2 text-center border-r">
                    อยู่ระหว่างยืม
                  </th>
                  <th className="px-4 py-2 text-center border-r">สมบูรณ์</th>
                  <th className="px-4 py-2 text-center border-r">ไม่สมบูรณ์</th>
                  <th className="px-4 py-2 text-center border-r">หาย</th>
                  <th className="px-4 py-2 text-center">หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipment.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 align-top border-r">
                      <div>
                        <div>รหัส {item.code}</div>
                        <div>ชื่อ : {item.name}</div>
                        <div>รายละเอียด {item.description}</div>
                        <div>หมวดหมู่ : {item.category}</div>
                        <div>
                          สถานะ:{" "}
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
                          <Link href={`/EditItem/${item.id}`}>
                            <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs">
                              ✏️ แก้ไข
                            </button>
                          </Link>
                          <button
                            className="bg-gray-300 px-3 py-1 rounded text-xs hover:bg-gray-400"
                            onClick={() => handleShowHistory(item)}
                          >
                            📈 ประวัติยืมคืน
                          </button>
                          <button
                            className="bg-[#E74C3C] px-3 py-1 rounded text-xs hover:bg-[#b24236] text-white"
                            onClick={() => handleDelete(item.id)}
                          >
                            🗑️ ลบ
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
                  currentPage === page
                    ? "bg-gray-200 font-bold"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="px-2 py-1 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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

          {/* Modal ประวัติการยืม */}
          {showHistory && selectedItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-5xl max-h-[90%] overflow-y-auto p-6 relative">
                <button
                  onClick={() => setShowHistory(false)}
                  className="absolute top-2 right-3 text-lg font-bold text-gray-600 hover:text-black"
                >
                  ✕
                </button>
                <h2 className="text-xl font-bold mb-4">
                  ประวัติ: {selectedItem.name}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-2 py-2 border">เลขที่ยืม</th>
                        <th className="px-2 py-2 border">ชื่อ-นามสกุล</th>
                        <th className="px-2 py-2 border">วันที่ยืม</th>
                        <th className="px-2 py-2 border">กำหนดคืน</th>
                        <th className="px-2 py-2 border">คืนจริง</th>
                        <th className="px-2 py-2 border">จำนวน</th>
                        <th className="px-2 py-2 border">สถานที่ใช้</th>
                        <th className="px-2 py-2 border">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="border px-2 py-1 text-center"
                          >
                            ไม่มีประวัติการยืม
                          </td>
                        </tr>
                      ) : (
                        historyData.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="border px-2 py-1 text-center">
                              {item.id}
                            </td>
                            <td className="border px-2 py-1">{item.name}</td>
                            <td className="border px-2 py-1 text-center">
                              {item.borrowDate
                                ? new Date(item.borrowDate).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.dueDate
                                ? new Date(item.dueDate).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.returnDate
                                ? new Date(item.returnDate).toLocaleDateString(
                                    "th-TH"
                                  )
                                : "-"}
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
                        ))
                      )}
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
