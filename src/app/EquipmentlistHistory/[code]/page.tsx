"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/SideBar";
import Swal from "sweetalert2";
import { Equipment, EquipmentHistory, EquipmentInstanceHistory } from "@/types/equipment";

export default function EquipmentHistoryPage() {
  const params = useParams();
  const code = params?.code as string;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [historyData, setHistoryData] = useState<EquipmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const router = useRouter();

  // Toggle expandable row
  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

const uniqueHistoryData = React.useMemo(() => {
  const map = new Map<number, any>();

  historyData.forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, {
        ...item,
        instances: item.equipmentInstance
              ? [{
                  ...item.equipmentInstance,
                  condition: item.returnHistories?.[0]?.condition || null, 
                  note: item.returnHistories?.[0]?.note || null,
                }]
              : [],
        returnHistories: item.returnHistories || [],
      });
    } else {
      const existing = map.get(item.id)!;
      map.set(item.id, {
        ...existing,
        instances: [
          ...existing.instances,
          ...(item.equipmentInstance
            ? [{
                ...item.equipmentInstance,
                condition: item.returnHistories?.[0]?.condition || null, 
                note: item.returnHistories?.[0]?.note || null,
              }]
            : []),
        ],
        returnHistories: [
          ...(existing.returnHistories || []),
          ...(item.returnHistories || []),
        ],
      });
    }
  });

  return Array.from(map.values());
}, [historyData]);


  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/history/equipments/${code}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const text = await response.text();
      if (!response.ok) {
        let errorMessage = text;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || text;
        } catch {}
        throw new Error(errorMessage || "Failed to fetch history");
      }

      const data = JSON.parse(text);
      console.log(data)
      setEquipment(data.equipment);
      setHistoryData(data.history);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการดึงประวัติ");
      await Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: err.message || "ไม่สามารถดึงประวัติได้",
        icon: "error",
        draggable: true,
        showConfirmButton: true,
        confirmButtonText: "ลองใหม่",
        confirmButtonColor: "#4682B4",
      }).then((result) => {
        if (result.isConfirmed) {
          fetchHistory();
        }
      });
    }
  };

  useEffect(() => {
    if (!code) {
      setLoading(false);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่พบรหัสอุปกรณ์",
        icon: "error",
        draggable: true,
      });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchHistory();
      setLoading(false);
    };

    loadData();
  }, [code]);

  const formatThaiDate = (isoDate: string | null): string => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };
  const getConditionColor = (condition?: string) => {
  switch (condition) {
    case "สมบูรณ์":
      return "bg-green-100 text-green-700";
    case "ชำรุด":
      return "bg-yellow-100 text-yellow-800";
    case "สูญหาย":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-prompt">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#DCDCDC] bg-gray-50 max-w-full">
          {loading && <FullScreenLoader/>}
          
          {!loading && !equipment && (
            <div className="text-center text-red-500 mt-10">
              ไม่พบข้อมูลอุปกรณ์
              <button
                onClick={() => fetchHistory()}
                className="ml-4 bg-[#4682B4] text-white px-4 py-2 rounded hover:bg-[#2B5279]"
              >
                ลองใหม่
              </button>
            </div>
          )}
          
          {equipment && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">
                  ประวัติการยืมคืน: {equipment.name}
                </h1>
                <button
                  onClick={() => router.back()}
                  className="bg-[#4682B4] text-white px-4 py-2 rounded hover:bg-[#2B5279] flex items-center gap-2 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  กลับ
                </button>
              </div>
              <hr className="mb-6 border-[#DCDCDC]" />

              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-bold text-[#4682B4] mb-4">ข้อมูลอุปกรณ์</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>หมวดหมู่:</strong> {equipment.category}</p>
                    <p>
                      <strong>สถานะ:</strong>{" "}
                      <span
                        className={`inline-flex items-center gap-1 ${
                          equipment.status === "ยืมได้"
                            ? "text-green-600"
                            : equipment.status === "อยู่ระหว่างยืม"
                              ? "text-blue-600"
                              : "text-red-600"
                        }`}
                      >
                        {equipment.status === "ยืมได้" && <span className="w-2 h-2 rounded-full bg-green-600"></span>}
                        {equipment.status === "อยู่ระหว่างยืม" && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                        {equipment.status !== "ยืมได้" && equipment.status !== "อยู่ระหว่างยืม" && <span className="w-2 h-2 rounded-full bg-red-600"></span>}
                        {equipment.status}
                      </span>
                    </p>
                    <p><strong>ที่เก็บ:</strong> {equipment.location}</p>
                    <p><strong>คำอธิบาย:</strong> {equipment.description || "ไม่มี"}</p>
                    <p><strong>หน่วย:</strong> {equipment.unit}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>ทั้งหมด:</strong> {equipment.all} {equipment.unit}</p>
                    <p><strong>พร้อมใช้งาน:</strong> {equipment.available} {equipment.unit}</p>
                    <p><strong>กำลังใช้งาน:</strong> {equipment.used} {equipment.unit}</p>
                    <p><strong>ชำรุด:</strong> {equipment.broken} {equipment.unit}</p>
                    <p><strong>สูญหาย:</strong> {equipment.lost} {equipment.unit}</p>
                  </div>
                </div>
              </div>

              <div className="rounded bg-white p-4 shadow-md">
                <h2 className="text-lg font-bold text-[#4682B4] mb-4">ประวัติการยืมคืน</h2>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full table-auto text-sm border border-gray-200">
                    <thead className="bg-[#2B5279] text-white">
                      <tr>
                        <th className="px-4 py-3 text-left border-r">เลขที่ยืม</th>
                        <th className="px-4 py-3 text-left border-r">ชื่อ-นามสกุลผู้ยืม</th>
                        <th className="px-4 py-3 text-center border-r">วันที่ยืม</th>
                        <th className="px-4 py-3 text-center border-r">กำหนดคืน</th>
                        <th className="px-4 py-3 text-center border-r">คืนจริง</th>
                        <th className="px-4 py-3 text-center border-r">สถานะ</th>
                        <th className="px-4 py-3 text-center">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueHistoryData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="border px-4 py-3 text-center text-gray-500">
                            ไม่มีประวัติการยืม
                          </td>
                        </tr>
                      ) : (
                        uniqueHistoryData.map((item, i) => (
                          
                          <React.Fragment key={i}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 border-r text-center">{item.id}</td>
                              <td className="px-4 py-3 border-r">{item.name}</td>
                              <td className="px-4 py-3 border-r text-center">{formatThaiDate(item.borrowDate)}</td>
                              <td className="px-4 py-3 border-r text-center">{formatThaiDate(item.dueDate)}</td>
                              <td className="px-4 py-3 border-r text-center">{formatThaiDate(item.returnDate)}</td>
                              <td className="px-4 py-3 border-r text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs sm:text-sm whitespace-nowrap ${
                                    item.status === "รับคืนแล้ว"
                                      ? "bg-green-100 text-green-700"
                                      : item.status === "อยู่ระหว่างยืม"
                                        ? "bg-[#4684BC] text-white"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.status === "รับคืนแล้ว" && <span className="w-2 h-2 rounded-full bg-green-700"></span>}
                                  {item.status === "อยู่ระหว่างยืม" && <span className="w-2 h-2 rounded-full bg-[#4684BC]"></span>}
                                  {item.status !== "รับคืนแล้ว" && item.status !== "อยู่ระหว่างยืม" && <span className="w-2 h-2 rounded-full bg-red-800"></span>}
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      const className =
                                        typeof e.currentTarget.className === "string"
                                          ? e.currentTarget.className
                                          : "";
                                      console.log(className); // ตรวจสอบว่ามีค่าไหม
                                      toggleRow(item.id);
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={expandedRows.includes(item.id) ? faChevronUp : faChevronDown}
                                      className="text-[#4682B4] cursor-pointer"
                                    />
                                  </button>
                              </td>
                            </tr>
                            {expandedRows.includes(item.id) && (
                              <tr>
                                <td colSpan={7} className="border px-4 py-3 bg-gray-50">
                                  <div className="bg-white p-3 rounded border border-gray-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">


                                      <p><strong>จำนวนที่ยืม:</strong> {item.instances?.length || 0}</p>
                                      <p><strong>สถานที่ใช้:</strong> {item.place || "-"}</p>
                                    </div>
                                      {item.instances && item.instances.length > 0 && (
                                        <>
                                          <h3 className="text-sm font-semibold mb-2 text-[#4682B4]">
                                            รายการในใบยืมนี้ ({item.instances.length} รายการ)
                                          </h3>
                                          <table className="min-w-full table-auto border text-xs">
                                            <thead className="bg-gray-200">
                                              <tr>
                                                <th className="px-2 py-1 border">หมายเลขครุภัณฑ์</th>
                                                <th className="px-2 py-1 border">สภาพหลังคืน</th>
                                                <th className="px-2 py-1 border">หมายเหตุ</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {item.instances.map((inst :EquipmentInstanceHistory, index:number) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                  <td className="border px-2 py-1">{inst.serialNumber}</td>
                                                  <td className="border px-2 py-1 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs  cursor-pointer ${getConditionColor(inst.condition ?? undefined)}`}>
                                                      {inst.condition || "-"}
                                                    </span>
                                                  </td>
                                                  <td className="border px-2 py-1">{inst.note || "-"}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>

                                          {item.overallReturnNote && (
                                            <div className="mt-2 text-sm text-gray-600">
                                              <strong>หมายเหตุรวม:</strong> {item.overallReturnNote}
                                            </div>
                                          )}
                                        </>
                                      )}

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Card Layout for Mobile */}
                <div className="md:hidden space-y-4">
                  {uniqueHistoryData.length === 0 ? (
                    <div className="text-center text-gray-500">ไม่มีประวัติการยืม</div>
                  ) : (
                    uniqueHistoryData.map((item, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-semibold text-[#4682B4]">
                            เลขที่ยืม: {item.id}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(item.id);
                            }}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            <FontAwesomeIcon
                              icon={expandedRows.includes(item.id) ? faChevronUp : faChevronDown}
                              className="text-[#4682B4]"
                            />
                          </button>
                        </div>
                        <p><strong>ชื่อ:</strong> {item.name}</p>
                        <p><strong>วันที่ยืม:</strong> {formatThaiDate(item.borrowDate)}</p>
                        <p><strong>กำหนดคืน:</strong> {formatThaiDate(item.dueDate)}</p>
                        <p><strong>คืนจริง:</strong> {formatThaiDate(item.returnDate)}</p>
                        <p>
                          <strong>สถานะ:</strong>{" "}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                item.status === "รับคืนแล้ว"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "อยู่ระหว่างยืม"
                                    ? "bg-[#4684BC] text-white"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status === "รับคืนแล้ว" && <span className="w-2 h-2 rounded-full bg-green-600"></span>}
                            {item.status === "อยู่ระหว่างยืม" && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                            {item.status !== "รับคืนแล้ว" && item.status !== "อยู่ระหว่างยืม" && (
                              <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            )}
                            {item.status}
                          </span>
                        </p>                       
                        {expandedRows.includes(item.id) && (
                          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="grid grid-cols-1 gap-4 mb-4">
                              <p><strong>จำนวนที่ยืม:</strong> {item.instances?.length || 0}</p>
                              <p><strong>สถานที่ใช้:</strong> {item.place || "-"}</p>
                            </div>
                            {item.instances && item.instances.length > 0 && (
                              <>
                                <h3 className="text-sm font-semibold mb-2 text-[#4682B4]">
                                  รายการในใบยืมนี้ ({item.instances.length} รายการ)
                                </h3>
                                <table className="min-w-full table-auto border text-xs">
                                  <thead className="bg-gray-200">
                                    <tr>
                                      <th className="px-2 py-1 border">หมายเลขครุภัณฑ์</th>
                                      <th className="px-2 py-1 border">สภาพหลังคืน</th>
                                      <th className="px-2 py-1 border">หมายเหตุ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.instances.map((inst: EquipmentInstanceHistory, index: number) => (
                                      <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="border px-2 py-1">{inst.serialNumber}</td>
                                        <td className="border px-2 py-1 text-center">
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getConditionColor(
                                              inst.condition ?? undefined
                                            )}`}
                                          >
                                            {inst.condition || "-"}
                                          </span>
                                        </td>
                                        <td className="border px-2 py-1">{inst.note || "-"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {item.overallReturnNote && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <strong>หมายเหตุรวม:</strong> {item.overallReturnNote}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}