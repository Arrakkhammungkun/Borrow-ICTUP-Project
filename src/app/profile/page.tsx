"use client";

import React, { useState } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    prefix: "",
    firstName: "",
    lastName: "",
    position: "",
    faculty: "",
    phone: "",
    workplace: "",
  });

  const handleChange = (e:any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log("บันทึกข้อมูล:", formData);
    alert("บันทึกข้อมูลเรียบร้อยแล้ว ✅");
  };

  const handleCancel = () => {
    console.log("ยกเลิกการแก้ไข");
    alert("ยกเลิกการแก้ไข ❌");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex-1 p-6 mt-16 text-black border rounded-md border-[#3333] bg-white min-h-[700px]">
            {/* Title */}
            <h2 className="text-xl font-bold text-[#364153] mb-4">
              แก้ไขโปรไฟล์ของผู้ใช้
            </h2>
            <hr className="mb-6 rounded-md border-[#3333]" />

            {/* Form */}
            <div className="grid grid-cols-1 gap-4">
              {/* Row 1: Prefix + Firstname + Lastname */}
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-[0.4] w-full sm:w-auto"
                >
                  <option value="">คำนำหน้า</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="ผ.ศ">ผศ.</option>
                  <option value="ด.ต">ดร.</option>
                  <option value="ด.ต">รศ.</option>
                  <option value="ด.ต">ศ.</option>
                </select>

                <input
                  type="text"
                  name="firstName"
                  placeholder="ชื่อ"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-1 w-full"
                />

                <input
                  type="text"
                  name="lastName"
                  placeholder="นามสกุล"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-1 w-full"
                />
              </div>

              {/* Row 2: Position + Faculty */}
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  name="position"
                  placeholder="ตำแหน่ง"
                  value={formData.position}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-1 w-full"
                />

                <input
                  type="text"
                  name="faculty"
                  placeholder="คณะ/กอง/ศูนย์"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-1 w-full"
                />
              </div>

              {/* Row 3: Workplace + Phone */}
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  name="phone"
                  placeholder="เบอร์โทรศัพท์"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-1 w-full"
                />

                <input
                  type="text"
                  name="workplace"
                  placeholder="สถานที่ทำงาน"
                  value={formData.workplace}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 flex-1 w-full"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded bg-green-500 text-white hover:bg-green-600"
              >
                บันทึก
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}