"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { useParams, useRouter } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Equipment } from "@/types/equipment";

export default function AddItemInstance() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipmentName, setEquipmentName] = useState<Equipment | null>(null);
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [formData, setFormData] = useState({
    count: "",
    serialPrefix: "",
    location: "",
    serialNumber: "",
    note: "",
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/AddItem/equipments/${id}`)
        .then((res) => res.json())
        .then((data) => setEquipmentName(data))
        .catch(console.error);
    }
  }, [id]);

  const handleClose = () => {
    setFormData({
      count: "",
      serialPrefix: "",
      location: "",
      serialNumber: "",
      note: "",
    });
    router.push(`/Equipmentlist/${id}/items`);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      mode,
      ...(mode === "auto"
        ? {
            quantity: Number(formData.count),
            serialPrefix: formData.serialPrefix,
          }
        : { serialNumber: formData.serialNumber }),
      location: formData.location,
    };

    setLoading(true);
    try {
      const res = await fetch(`/api/AddItem/${id}/instances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseJson = await res.json();
      if (!res.ok) {
        setLoading(false);
        throw new Error(
          responseJson?.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล"
        );
      }

      setLoading(false);
      await Swal.fire({
        title: "เพิ่มรายการสำเร็จ!",
        icon: "success",
        draggable: true,
      });

      setFormData({
        count: "",
        serialPrefix: "",
        location: "",
        serialNumber: "",
        note: "",
      });
      router.push(`/Equipmentlist/${id}/items`);
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        console.error(err);
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: err.message || "ไม่สามารถเพิ่มรายการได้",
          icon: "error",
          draggable: true,
        });
      } else {
        console.error(err);
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          icon: "error",
          draggable: true,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <Navbar />
      <div className="flex flex-1 p-2">
        <Sidebar />
        <main className="flex-1 p-6 ml-0 mt-16 text-black border-1 rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-2xl font-bold mb-2 text-[#4682B4]">
            เพิ่มรายการครุภัณฑ์ (Instance)
          </h1>
          <hr className="mb-4 border-[#DCDCDC]" />
          <div className="ml-2">
            <h1 className="text-md mb-2">
              เพิ่มรายการของ: {equipmentName?.name || "กำลังโหลด..."}
            </h1>
            <h1 className="text-md mb-2">
              รหัสประเภทครุภัณฑ์: {equipmentName?.code || "กำลังโหลด..."}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:px-2 max-w-160">
            <div>
              <div className="mb-4">
                <label className="block mb-1">โหมดการเพิ่ม</label>
                <select
                  name="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as  "manual"| "auto")}
                  className="w-full border rounded px-3 py-2"
                >   
                  <option value="manual">Manual (เพิ่มเดี่ยว)</option>
                  <option value="auto">Auto (เพิ่มหลายรายการ)</option>
                  
                </select>
              </div>
                <p className="text-sm text-gray-500 mt-1">
                  {mode === "manual"
                    ? "Manual: ใส่ Serial Number ทีละตัวเอง  เช่น SE001-001"
                    : "Auto: ระบบจะสร้าง Serial Number และเพิ่มหลายรายการตามจำนวน เช่น เพิ่ม SE001- ระบบจะเพิ่ม SE001-001, SE001-002, เป็นต้น"}
                </p>
            </div>

            {mode === "auto" ? (
              <>
                <div>
                  <label className="block mb-1">จำนวนที่ต้องการเพิ่ม</label>
                  <input
                    type="number"
                    name="count"
                    value={formData.count}
                    onChange={handleChange}
                    placeholder="จำนวน"
                    className="w-full border rounded px-3 py-2"
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="block mb-1">คำนำหน้า Serial Number</label>
                  <input
                    type="text"
                    name="serialPrefix"
                    value={formData.serialPrefix}
                    onChange={handleChange}
                    placeholder="คำนำหน้า Serial Number (เช่น SN-)"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block mb-1">Serial Number</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Serial Number"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            )}

            <div>
              <label className="block mb-1">สถานที่เก็บ</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="เช่น ห้องเก็บครุภัณฑ์ 1"
                className="w-full border rounded px-3 py-2"
                
              />
            </div>
            <div>
              <label className="block mb-1">หมายเหตุ</label>
              <input
                type="text"
                name="location"
                value={formData.note}
                onChange={handleChange}
                placeholder="หมายเหตุ (ถ้ามี)"
                className="w-full border rounded px-3 py-2"
             
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer"
              >
                เพิ่มรายการ
              </button>
              <button
                type="button"
                className="bg-[#E74C3C] text-white px-4 py-2 rounded hover:bg-red-600 cursor-pointer"
                onClick={handleClose}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </main>
      </div>
      {loading && <FullScreenLoader />}
    </div>
  );
}