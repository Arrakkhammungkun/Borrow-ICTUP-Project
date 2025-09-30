"use client";

import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function AddItem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    status: "AVAILABLE",
    location: "",
    quantity: "",
    unit: "",
    description: "",
    feature: "",
    isIndividual: false,
  });

  const handleClose = () => {
    setFormData({
      code: "",
      name: "",
      category: "",
      status: "AVAILABLE",
      location: "",
      quantity: "",
      unit: "",
      description: "",
      feature: "",
      isIndividual: false,
    });
    router.push('/Equipmentlist');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      serialNumber: formData.isIndividual ? formData.code : null,
      category: formData.category,
      description: formData.description || "",
      total: formData.isIndividual ? 0 : Number(formData.quantity),
      status: formData.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
      unit: formData.unit,
      storageLocation: formData.location,
      feature: formData.feature || "",
      isIndividual: formData.isIndividual,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/AddItem/AddItemNew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseJson = await res.json();
      if (!res.ok) {
        setLoading(false);
        throw new Error(responseJson?.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
      }
      setLoading(false);
      await Swal.fire({
        title: "เพิ่มรายการสำเร็จ!",
        icon: "success",
        draggable: true,
      });

      setFormData({
        code: "",
        name: "",
        category: "",
        status: "AVAILABLE",
        location: "",
        quantity: "",
        unit: "",
        description: "",
        feature: "",
        isIndividual: false,
      });
      router.push('/Equipmentlist');
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
          <h1 className="text-2xl font-bold mb-2 text-[#4682B4]">เพิ่มรายการครุภัณฑ์</h1>
          <hr className="mb-4 border-[#DCDCDC]" />

          <form onSubmit={handleSubmit} className="space-y-2 sm:px-2 max-w-160">
            <div>
              <label className="block mb-1">รหัสครุภัณฑ์</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="รหัสครุภัณฑ์"
                className="w-full border rounded px-3 py-2"
                required={formData.isIndividual}
                disabled={!formData.isIndividual}
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
              <label className="block mb-1">สาขา</label>
              <select
                name="feature"
                value={formData.feature}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- เลือกสาขา --</option>
                <option value="BBA">สาขาวิชาคอมพิวเตอร์ธุรกิจ</option>
                <option value="CPE">สาขาวิชาวิศวกรรมคอมพิวเตอร์</option>
                <option value="DB">สาขาวิชาธุรกิจดิจิทัล</option>
                <option value="SE">สาขาวิชาวิศวกรรมซอฟต์แวร์</option>
                <option value="CS">สาขาวิชาวิทยาการคอมพิวเตอร์</option>
                <option value="IT">สาขาวิชาเทคโนโลยีสารสนเทศ</option>
                <option value="GIS">สาขาวิชาภูมิสารสนเทศศาสตร์</option>
                <option value="CGM">สาขาวิชาคอมพิวเตอร์กราฟิกและมัลติมีเดีย</option>
              </select>
            </div>

            <div>
              <label className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="isIndividual"
                  checked={formData.isIndividual}
                  onChange={handleChange}
                  className="mr-2"
                />
                เป็นครุภัณฑ์เดี่ยว (เช่น โต๊ะ 1 ตัวมีรหัสเฉพาะ)
              </label>
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
                  required={!formData.isIndividual}
                  disabled={formData.isIndividual}
                  min={1}
                />
              </div>

              <div className="mb-4">
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