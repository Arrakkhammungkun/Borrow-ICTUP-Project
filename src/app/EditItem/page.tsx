"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";   // <-- import Swal

export default function EditItem() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    serialNumber: "",
    name: "",
    category: "",
    description: "",
    total: "",
    status: "AVAILABLE",
    unit: "",
    storageLocation: "",
    state: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const res = await fetch(`/api/Equipment/${id}`);
        const result = await res.json();

        if (result.success) {
          setFormData({
            serialNumber: result.data.serialNumber || "",
            name: result.data.name || "",
            category: result.data.category || "",
            description: result.data.description || "",
            total: result.data.total?.toString() || "",
            status: result.data.status || "AVAILABLE",
            unit: result.data.unit || "",
            storageLocation: result.data.storageLocation || "",
            state: result.data.state || "",
          });
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.error("โหลดข้อมูลล้มเหลว:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/EditItem", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipment_id: parseInt(id), // id จาก URL หรือ state
        serialNumber: formData.serialNumber,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        total: parseInt(formData.total),
        status: formData.status,
        unit: formData.unit,
        storageLocation: formData.storageLocation,
        state: formData.state,
      }),
    });

    const result = await res.json();

    if (result.success) {
  Swal.fire({
    title: "บันทึกข้อมูลเรียบร้อยแล้ว",
    icon: "success",
    timer: 1500,
    showConfirmButton: false,
  }).then(() => {
    router.push("/Equipmentlist"); // <-- เปลี่ยนเส้นทาง
  });
}

  } catch (err) {
    console.error("ส่งข้อมูลล้มเหลว:", err);
  }
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
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="รหัสครุภัณฑ์"
                className="w-full border rounded px-3 py-2"
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
                name="storageLocation"
                value={formData.storageLocation}
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
                <option value="AVAILABLE">ยืมได้</option>
                <option value="UNAVAILABLE">ไม่สามารถยืมได้</option>
              </select>
            </div>

            <div className="max-w-94">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block mb-1">จำนวน</label>
                  <input
                    type="number"
                    name="total"
                    value={formData.total}
                    onChange={handleChange}
                    placeholder="จำนวน"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* <div className="flex-1">
                  <label className="block mb-1">ไม่สมบูรณ์</label>
                  <input
                    type="number"
                    name="Incomplete"
                    value={formData.Incomplete}
                    onChange={handleChange}
                    placeholder="ไม่สมบูรณ์"
                    className="w-full border rounded px-3 py-2"
                  />
                </div> */}
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

                {/* <div className="flex-1">
                  <label className="block mb-1">สูญหาย</label>
                  <input
                    type="number"
                    name="lost"
                    value={formData.lost}
                    onChange={handleChange}
                    placeholder="สูญหาย"
                    className="w-full border rounded px-3 py-2"
                  />
                </div> */}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 delay-25 duration-300 ease-in-out"
              >
                บันทึกการแก้ไข
              </button>
              <button
                type="button"
                className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 delay-25 duration-500 ease-in-out"
                onClick={() => window.history.back()}
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
