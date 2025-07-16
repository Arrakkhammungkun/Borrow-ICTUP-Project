"use client";

import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function AddItem() {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    status: 'ยืมได้',
    location: '',
    quantity: '',
    unit: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted data:', formData);
    // เพิ่ม logic ส่งไป backend ตรงนี้ได้
  };

  return (
    <div className="min-h-screen flex">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 ml-0 mt-16 text-black border-1 rounded-md border-[#3333] bg-gray-50">
            <h1 className="text-2xl font-bold mb-4 text-blue-400">เพิ่มรายการครุภัณฑ์</h1>
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
                />
              </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  เพิ่มรายการ
                </button>
                <button
                  type="button"
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
