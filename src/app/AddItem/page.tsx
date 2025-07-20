"use client";

import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function AddItem() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    status: "AVAILABLE", // ต้องตรง enum ใน Prisma
    location: "",
    quantity: "",
    unit: "",
    description: "",
    state: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
  name: formData.name,
  serialNumber: formData.code,
  category: formData.category,
  description: formData.description?.trim() !== "" ? formData.description : "-",
  total: Number(formData.quantity),
  status: formData.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
  unit: formData.unit,
  storageLocation: formData.location,
  state: formData.state?.trim() !== "" ? formData.state : "-",
};


    console.log("ส่ง payload:", payload);
    try {
      const res = await fetch("/api/AddItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseJson = await res.json();
      console.log("response status:", res.status);
      console.log("response JSON:", responseJson);

      if (!res.ok) {
        throw new Error(
          responseJson?.error || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล"
        );
      }

      Swal.fire({
      title: "บันทึกข้อมูลเรียบร้อยแล้ว",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      router.push("/Equipmentlist"); // <-- เปลี่ยนเส้นทางเหมือน EditItem
    });

      router.push("/Equipmentlist"); // <-- กลับไปหน้า /Equipment

      setFormData({
        code: "",
        name: "",
        category: "",
        status: "AVAILABLE",
        location: "",
        quantity: "",
        unit: "",
        description: "",
        state: "",
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: error.message || "ไม่สามารถเพิ่มรายการได้",
        icon: "error",
        draggable: true,
      });
    }
  };

  const handleCancel = () => {
    router.back(); // <-- กลับหน้าก่อนหน้า
  };

  return (
    <div className="min-h-screen flex">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 ml-0 mt-16 text-black border-1 rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-2xl font-bold mb-4 text-blue-400">
            เพิ่มรายการครุภัณฑ์
          </h1>
          <hr className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-2 px-10 max-w-160">
            <div>
              <label className="block mb-1">รหัสครุภัณฑ์</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="รหัสครุภัณฑ์"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1">ชื่อครุภัณฑ์</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ชื่อครุภัณฑ์"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1">หมวดหมู่</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="หมวดหมู่"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1">สถานที่เก็บ</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="สถานที่เก็บ"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1">สถานะ</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="AVAILABLE">ยืมได้</option>
                <option value="UNAVAILABLE">ไม่สามารถยืมได้</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">คำอธิบาย</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="คำอธิบาย"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1">สถานะย่อย (state)</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="สถานะย่อย"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="max-w-45">
              <div>
                <label className="block mb-1">จำนวน</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="จำนวน"
                  className="w-full border rounded px-3 py-2"
                  required
                  min={1}
                />
              </div>

              <div>
                <label className="block mb-1">หน่วย</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="หน่วย"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
