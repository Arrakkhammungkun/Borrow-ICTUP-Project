"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/SideBar";
import { Equipment } from "@/types/equipment";


export default function ItemList() {
  const params = useParams();
  const id = params?.id as string;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const fetchEquipment = async () => {
      try {
        const response = await fetch(`/api/AddItem/equipments/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch equipment");
        }
        const data = await response.json();
        console.log(data);
        setEquipment(data);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [id]);

  if (error) return <div>Error: {error}</div>;
  if (!equipment) return <div>ไม่พบข้อมูลอุปกรณ์</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          {loading && <FullScreenLoader />}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">
              {equipment.name} (รหัส: {equipment.code})
            </h1>
            <button
              onClick={() => router.push("/Equipmentlist")}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              กลับ
            </button>
          </div>
          <hr className="mb-6 border-[#DCDCDC]" />

          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm">
                  <strong>หมวดหมู่:</strong> {equipment.category}
                </p>
                <p className="text-sm">
                  <strong>สถานะ:</strong>{" "}
                  <span
                    className={`${
                      equipment.status === "ยืมได้"
                        ? "text-green-600"
                        : equipment.status === "อยู่ระหว่างยืม"
                          ? "text-blue-600"
                          : "text-red-600"
                    }`}
                  >
                    {equipment.status}
                  </span>
                </p>
                <p className="text-sm">
                  <strong>ที่เก็บ:</strong> {equipment.location}
                </p>
                <p className="text-sm">
                  <strong>คำอธิบาย:</strong> {equipment.description || "ไม่มี"}
                </p>
                <p className="text-sm">
                  <strong>หน่วย:</strong> {equipment.unit} {" "}
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <strong>ทั้งหมด:</strong> {equipment.all} {equipment.unit}
                </p>
 
                <p className="text-sm">
                  <strong>พร้อมใช้งาน:</strong> {equipment.available}{" "}
                  {equipment.unit}
                </p>
                <p className="text-sm">
                  <strong>กำลังใช้งาน:</strong> {equipment.used}{" "}
                  {equipment.unit}
                </p>
                <p className="text-sm">
                  <strong>ชำรุด:</strong> {equipment.broken} {equipment.unit}
                </p>
                <p className="text-sm">
                  <strong>สูญหาย:</strong> {equipment.lost} {equipment.unit}
                </p>
              </div>
            </div>
          </div>

          {equipment.isIndividual && (
            <div className="rounded overflow-x-auto bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#4682B4]">
                  รายการของจริง
                </h2>

                <div className="mt-4 flex gap-2">
                  <Link href={`/EditItem/${equipment.id}`}>
                    <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm">
                      ✏️ แก้ไข
                    </button>
                  </Link>
                  <Link href={`/equipment/${equipment.id}/create-items`}>
                    <button className="bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-teal-600 text-sm">
                      เพิ่มของจริง
                    </button>
                  </Link>
                </div>

              </div>
              <table className="min-w-full table-auto text-sm border border-gray-200">
                <thead className="bg-[#2B5279] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left border-r">
                      Serial Number
                    </th>
                    <th className="px-4 py-3 text-center border-r">สถานะ</th>
                    <th className="px-4 py-3 text-center border-r">ที่เก็บ</th>
                    <th className="px-4 py-3 text-center">หมายเหตุ</th>
                    <th className="px-4 py-3 text-center">แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.instances.length > 0 ? (
                    equipment.instances.map((instance) => (
                      <tr key={instance.id} className="border-t">
                        <td className="px-4 py-3 border-r">
                          {instance.serialNumber}
                        </td>
                        <td className="px-4 py-3 text-center border-r">
                          <span
                            className={`${
                              instance.status === "AVAILABLE"
                                ? "text-green-600"
                                : instance.status === "IN_USE"
                                  ? "text-blue-600"
                                  : instance.status === "BROKEN" ||
                                      instance.status === "LOST"
                                    ? "text-red-600"
                                    : "text-gray-600"
                            }`}
                          >
                            {instance.status === "AVAILABLE"
                              ? "พร้อมใช้งาน"
                              : instance.status === "IN_USE"
                                ? "กำลังใช้งาน"
                                : instance.status === "BROKEN"
                                  ? "ชำรุด"
                                  : instance.status === "LOST"
                                    ? "สูญหาย"
                                    : "ไม่พร้อมใช้งาน"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center border-r">
                          {instance.location || "ไม่ระบุ"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {instance.note || "ไม่มี"}
                        </td>
                        <td className="px-4 py-3 text-center">
                                     
                          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm">
                            ✏️ แก้ไข
                          </button>
               
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="border px-4 py-3 text-center text-gray-500"
                      >
                        ยังไม่มีรายการของจริง
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
