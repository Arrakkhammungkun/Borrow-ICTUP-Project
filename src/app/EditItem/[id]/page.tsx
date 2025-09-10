"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function EditItem() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    status: "ยืมได้",
    location: "",
    quantity: "",
    unit: "",
    brokenQuantity: "",
    lostQuantity: "",
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!params.id) return;
      try {
        const res = await fetch(`/api/equipments/${params.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        console.log(data)
        setFormData({
          code: data.code || "",
          name: data.name || "",
          category: data.category || "",
          status: data.status === "AVAILABLE" ? "ยืมได้" : "ไม่สามารถยืมได้",
          location: data.location || "",
          quantity: data.quantity || "",
          unit: data.unit || "",
          brokenQuantity: data.brokenQuantity || "",
          lostQuantity: data.lostQuantity || "",
        });
      } catch (error) {
        console.error("โหลดข้อมูลอุปกรณ์ล้มเหลว:", error);
      }
    };
    fetchEquipment();
  }, [params.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "บันทึกข้อมูลหรือไม่?",
      text: "คุณต้องการบันทึกข้อมูลใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, บันทึก",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/equipments/${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            serialNumber: formData.code,
            name: formData.name,
            category: formData.category,
            status: formData.status === "ยืมได้" ? "AVAILABLE" : "UNAVAILABLE",
            storageLocation: formData.location,
            total: parseInt(formData.quantity) || 0,
            unit: formData.unit,
            brokenQuantity: parseInt(formData.brokenQuantity) || 0,
            lostQuantity: parseInt(formData.lostQuantity) || 0,
          }),
        });
        if (res.ok) {
          await Swal.fire("สำเร็จ!", "บันทึกข้อมูลสำเร็จ", "success");
          router.push("/Equipmentlist");
        } else {
          const errorData = await res.json();
          Swal.fire("ผิดพลาด!", errorData.error || "Failed to reject", "error");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในบันทึกข้อมูล", "error");
      }
    }
  };

  const handleCancel = () => {
    router.push("/Equipmentlist");
  };

  return (
    <div className="min-h-screen flex">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 ml-0 mt-16 text-black border-1 rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-2xl font-bold mb-4 text-blue-400">
            แก้ไขรายการครุภัณฑ์
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
                // readOnly
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
              />
            </div>
            <div>
              <label className="block mb-1">สถานะ</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="ยืมได้">ยืมได้</option>
                <option value="ไม่สามารถยืมได้">ไม่สามารถยืมได้</option>
              </select>
            </div>
            <div className="max-w-94">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block mb-1">จำนวน</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="จำนวน"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1">ไม่สมบูรณ์</label>
                  <input
                    type="number"
                    name="brokenQuantity"
                    value={formData.brokenQuantity}
                    onChange={handleChange}
                    placeholder="ไม่สมบูรณ์"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block mb-1">หน่วย</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="หน่วย"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1">สูญหาย</label>
                  <input
                    type="number"
                    name="lostQuantity"
                    value={formData.lostQuantity}
                    onChange={handleChange}
                    placeholder="สูญหาย"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                บันทึกการแก้ไข
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
