"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Equipment} from "@/types/equipment";
import Swal from "sweetalert2";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
interface CSVRow {
  equipmentCode: string;
  equipmentName: string;
  category: string;
  description: string;
  unit: string;
  serialNumber: string;
  status: string;
  location: string;
  note: string;
}
export default function MyEquipmentList() {
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const itemsPerPage = 5;
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const _router = useRouter();
  const [loading, setLoading] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/equipments/owner");
      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
      
      const data = await res.json();
      
      setEquipmentData(data);
    } catch (error) {
      console.error("โหลดข้อมูลอุปกรณ์ล้มเหลว:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    let filtered = equipmentData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedStatus) {
      if (selectedStatus === "ไม่สามารถยืมได้") {
        filtered = filtered.filter(
          (item) => item.status === "งดการยืม" || item.status === "เลิกใช้งาน"
        );
      } else {
        filtered = filtered.filter((item) => item.status === selectedStatus);
      }
    }

    setFilteredEquipment(filtered);
    setCurrentPage(1);
  }, [searchQuery, equipmentData, selectedStatus]);


  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
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

        const requiredHeaders = [
          "equipmentCode",
          "equipmentName",
          "category",
          "description",
          "unit",
          "serialNumber",
          "status",
          "location",
          "note",
        ];
        const headers = Object.keys(csvData[0]);
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

        // Validate required fields and status
        const invalidRows = csvData.filter(
          (row) =>
            !row.equipmentCode ||
            !row.equipmentName ||
            !row.category ||
            !row.unit ||
            !row.serialNumber ||
            !row.status ||
            !["AVAILABLE", "UNAVAILABLE", "IN_USE", "BROKEN", "LOST"].includes(
              row.status
            )
        );
        if (invalidRows.length > 0) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด!",
            text: "ข้อมูลใน CSV ไม่ครบถ้วนหรือสถานะไม่ถูกต้องในบางแถว (เช่น equipmentCode, equipmentName, category, unit, serialNumber, status ต้องมีค่า และ status ต้องเป็น AVAILABLE, UNAVAILABLE, IN_USE, BROKEN หรือ LOST)",
            icon: "error",
            draggable: true,
          });
          return;
        }

        setLoading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/AddItem/AdditemCsv", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          const responseJson = await res.json();

          if (!res.ok) {
            setLoading(false);
            throw new Error(
              responseJson?.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล"
            );
          }

          setLoading(false);
          if (responseJson.success) {
            await Swal.fire({
              title: "นำเข้าสำเร็จ!",
              text: responseJson.message,
              icon: "success",
              draggable: true,
            });
          } else {
            await Swal.fire({
              title: "เกิดข้อผิดพลาดบางส่วน!",
              text: `${responseJson.message}\nรายละเอียดข้อผิดพลาด: ${
                responseJson.errors?.length > 0
                  ? responseJson.errors.join("\n")
                  : "ไม่มีรายละเอียดเพิ่มเติม"
              }`,
              icon: "warning",
              draggable: true,
            });
          }
          await fetchEquipment(); 
        } catch (err: unknown) {
          setLoading(false);
          if (err instanceof Error) {
            Swal.fire({
              title: "เกิดข้อผิดพลาด!",
              text: err.message || "ไม่สามารถนำเข้าข้อมูลได้",
              icon: "error",
              draggable: true,
            });
          } else {
            Swal.fire({
              title: "เกิดข้อผิดพลาด!",
              text: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
              icon: "error",
              draggable: true,
            });
          }
        }
      },
      error: (error) => {
        setLoading(false);
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">
              รายการอุปกรณ์ของฉัน
            </h1>
          </div>
          {loading && <FullScreenLoader />}
          <hr className="mb-6 border-[#DCDCDC]" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 rounded w-full sm:w-64 h-10 border-[#87A9C4] border-2 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4]"
                  placeholder="รายการ"
                />
                <button className="bg-[#25B99A] text-white px-3 py-2 sm:px-4 sm:py-2 h-10 rounded hover:bg-teal-600 w-fit sm:w-auto flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                  ค้นหา
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Link href={"/AddItem/AdditemNew"}>
                <button
                  type="submit"
                  className="bg-[#25B99A] text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-green-600 w-full sm:w-auto text-sm sm:text-base cursor-pointer"
                >
                  เพิ่มประเภท
                </button>
              </Link>
              <label
                htmlFor="csv-upload"
                className="bg-[#3498DB] text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-600 cursor-pointer w-full sm:w-auto flex items-center justify-center text-sm sm:text-base"
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

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 text-xs sm:text-sm justify-start sm:justify-end">
            {["ALL", "ยืมได้", "อยู่ระหว่างยืม", "ไม่สามารถยืมได้"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status === "ALL" ? null : status)}
                className={`flex items-center gap-1 px-3 py-1 rounded ${
                  (status === "ALL" && selectedStatus === null) || selectedStatus === status
                    ? "text-[#996000]"
                    : "text-gray-800 hover:text-[#996000] cursor-pointer"
                }`}
              >
                <span>{status === "ALL" ? "ทั้งหมด" : status}</span>
                <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
                  {status === "ALL"
                    ? equipmentData.length
                    : status === "ไม่สามารถยืมได้"
                    ? equipmentData.filter(
                        (item) => item.status === "งดการยืม" || item.status === "เลิกใช้งาน"
                      ).length
                    : equipmentData.filter((item) => item.status === status).length}
                </span>
              </button>
            ))}
          </div>

          <div className="border rounded overflow-x-auto bg-white">
            <table className="min-w-full table-auto text-xs sm:text-sm border border-gray-200">
              <thead className="bg-[#2B5279] text-white text-xs sm:text-sm">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left border-r">
                    รายการ
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    ทั้งหมด
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    อยู่ระหว่างยืม
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    สมบูรณ์
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    ไม่สมบูรณ์
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center border-r">
                    หาย
                  </th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-center">
                    หน่วย
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipment.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border px-3 py-3 sm:px-4 sm:py-3 text-center text-gray-500 text-xs sm:text-sm"
                    >
                      ไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  paginatedEquipment.map((item) => (
                    <tr key={item.code} className="border-t">
                      <td className="px-3 py-3 sm:px-4 sm:py-3 align-top border-r">
                        <div>

                          <div>ชื่อ: {item.name}</div>
                          <div>รายละเอียด: {item.description}</div>
                          <div>หมวดหมู่: {item.category}</div>
                          <div>
                            สถานะ:{" "}
                            <span
                              className={`${
                                item.status === "ยืมได้"
                                  ? "text-green-600"
                                  : item.status === "อยู่ระหว่างยืม"
                                    ? "text-blue-600"
                                    : "text-red-600"
                              }`}
                            >
                              {item.status === "เลิกใช้งาน" || item.status === "งดการยืม"
                                ? "ไม่สามารถยืมได้"
                                : item.status}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Link href={`/EditItem/${item.id}`}>
                              <button className="bg-yellow-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-yellow-600 text-xs sm:text-sm cursor-pointer">
                                 แก้ไข
                              </button>
                            </Link>


                            <Link href={`/Equipmentlist/${item.id}/items`}>   
                              <button
                                className="bg-[#3c5ee7] px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm hover:bg-[#363ab2] text-white cursor-pointer"
                              
                              >
                                รายละเอียด
                              </button>
                            </Link>   
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.all}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.used}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.available}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.broken}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center border-r">
                        {item.lost}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-3 text-center">
                        {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                  currentPage === page
                    ? "bg-gray-200 font-bold"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 disabled:opacity-30"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
    </div>
  );
}