"use client";

import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";

export default function AddItem() {
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    status: "AVAILABLE", 
    location: "",
    quantity: "",
    unit: "",
    description: "",
    state: "",
    feature:""
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
      description: formData.description || "",
      total: Number(formData.quantity),
      status: formData.status === "ไม่สามารถยืมได้" ? "UNAVAILABLE" : "AVAILBLE",
      unit: formData.unit,
      storageLocation: formData.location,
      state: formData.state || "",
      feature:formData.feature,
    };

    try {

      const res = await fetch("/api/AddItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials:"include",
        body: JSON.stringify(payload),
      });
        
      const responseJson = await res.json();
      console.log("response status:", res.status);
      console.log("response JSON:", responseJson);

      if (!res.ok) {
        throw new Error(responseJson?.error || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
      }

      Swal.fire({
        title: "เพิ่มรายการสำเร็จ!",
        icon: "success",
        draggable: true,
      });

      setFormData({
        code: "",
        name: "",
        category: "",
        status: "AVAILBLE",
        location: "",
        quantity: "",
        unit: "",
        description: "",
        state: "",
        feature:"",
      });
    } catch (err: unknown) {
      if(err instanceof Error){
        console.error(err);
          Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: err.message || "ไม่สามารถเพิ่มรายการได้",
          icon: "error",
          draggable: true,
      });
      }else{
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
                <option value="AVAILBLE">ยืมได้</option>
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

            <div>
              <label className="block mb-1">สาขา</label>
              <select
                name="feature"
                value={formData.feature}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                {/* ค่าเริ่มต้นว่าง */}
                <option value="">-- เลือกสาขา --</option>
                
                {/* ตัวเลือกของคณะ ICT */}
                <option value="BBA">สาขาวิชาคอมพิวเตอร์ธุรกิจ</option>
                <option value="CPE">สาขาวิชาวิศวกรรมคอมพิวเตอร์</option>
                <option value="BBA">สาขาวิชาธุรกิจดิจิทัล</option>
                <option value="SE">สาขาวิชาวิศวกรรมซอฟต์แวร์</option>
                <option value="SE">สาขาวิชาวิศวกรรมซอฟต์แวร์</option>
                <option value="CS">สาขาวิชาวิทยาการคอมพิวเตอร์</option>
                <option value="DSA">สาขาวิชาวิทยาการคอมพิวเตอร์</option>
                <option value="IT">สาขาวิชาวิทยาการข้อมูลและการประยุกต์</option>
                <option value="IT">สาขาวิชาเทคโนโลยีสารสนเทศ</option>
                <option value="GIS">สาขาวิชาภูมิสารสนเทศศาสตร์</option>
                <option value="CGM">สาขาวิชาคอมพิวเตอร์กราฟิกและมัลติมีเดีย</option>
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
                onClick={() =>
                  setFormData({
                    code: "",
                    name: "",
                    category: "",
                    status: "AVAILBLE",
                    location: "",
                    quantity: "",
                    unit: "",
                    description: "",
                    state: "",
                    feature:"",
                  })
                }
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
