"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { useUser } from "@/contexts/UserContext";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    prefix: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    faculty: "",
    mobilePhone: "",
    officeLocation: "",
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // Flag to prevent API loop

  // Fetch user data on component mount and sync with UserContext
  useEffect(() => {
    if (hasFetched) return; // Prevent multiple API calls

    const fetchUserData = async () => {
      console.log("Fetching user data..."); // Debug log
      try {
        const response = await fetch("/api/user/getUser", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        if (result.success) {
          const userData = {
            prefix: result.data.prefix || "",
            firstName: result.data.first_name || "",
            lastName: result.data.last_name || "",
            jobTitle: result.data.jobTitle || "",
            faculty: result.data.title || "",
            mobilePhone: result.data.mobilePhone || "",
            officeLocation: result.data.officeLocation || "",
          };
          console.log("Fetched user data:", userData); // Debug log
          setFormData(userData);
          // Update UserContext with fetched data and calculated displayName
          setUser({
            ...result.data,
            displayName:
              `${userData.prefix} ${userData.firstName} ${userData.lastName}`.trim(),
          });
          setHasFetched(true); // Mark as fetched
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: result.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
            confirmButtonColor: "#3B82F6",
          });
        }
      } catch (error) {
        console.error("Fetch error:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          confirmButtonColor: "#3B82F6",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Remove setUser from dependencies

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`); // Debug log
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      console.log("Updated formData:", newFormData); // Debug log
      return newFormData;
    });
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณากรอกชื่อและนามสกุล",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    try {
      const response = await fetch("/api/user/updateProfile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: formData.prefix,
          first_name: formData.firstName,
          last_name: formData.lastName,
          jobTitle: formData.jobTitle,
          title: formData.faculty,
          mobilePhone: formData.mobilePhone,
          officeLocation: formData.officeLocation,
        }),
      });
      const result = await response.json();
      if (result.success) {
        const displayName =
          `${formData.prefix} ${formData.firstName} ${formData.lastName}`.trim();

        setUser({
          ...result.data,
          displayName,
        });
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "บันทึกข้อมูลเรียบร้อยแล้ว ",
          confirmButtonColor: "#3B82F6",
        });
        setIsEditMode(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: result.message || "ไม่สามารถบันทึกข้อมูลได้",
          confirmButtonColor: "#3B82F6",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการบันทึก",
        confirmButtonColor: "#3B82F6",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      prefix: user?.prefix || "",
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      jobTitle: user?.jobTitle || "",
      faculty: user?.title || "",
      mobilePhone: user?.mobilePhone || "",
      officeLocation: user?.officeLocation || "",
    });
    setIsEditMode(false);
    Swal.fire({
      icon: "info",
      title: "ยกเลิก",
      text: "ยกเลิกการแก้ไข ",
      confirmButtonColor: "#3B82F6",
    });
  };

  const handleEdit = () => {
    console.log("Edit mode activated");
    setIsEditMode(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        {loading && <FullScreenLoader />}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 mt-16">
          <div className="bg-white rounded-lg shadow-md p-6 ">
            <h2 className="text-2xl font-bold text-[#4682B4] mb-4">
              โปรไฟล์ของฉัน
            </h2>
            <hr className="mb-6 border-gray-200" />

            {/* Display Mode */}
            {!isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">ชื่อเต็ม</p>
                  <p className="text-lg text-gray-800">
                    {user?.displayName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">คำนำหน้า</p>
                  <p className="text-lg text-gray-800">
                    {formData.prefix || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ชื่อ</p>
                  <p className="text-lg text-gray-800">
                    {formData.firstName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">นามสกุล</p>
                  <p className="text-lg text-gray-800">
                    {formData.lastName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ตำแหน่ง</p>
                  <p className="text-lg text-gray-800">
                    {formData.faculty || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">คณะ/หน่วยงาน</p>
                  <p className="text-lg text-gray-800">
                    {formData.jobTitle || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                  <p className="text-lg text-gray-800">
                    {formData.mobilePhone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">สถานที่ทำงาน</p>
                  <p className="text-lg text-gray-800">
                    {formData.officeLocation || "-"}
                  </p>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="grid grid-cols-1 gap-4 dark:text-black">
                {/* Row 1: Prefix + Firstname + Lastname */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-[0.4] w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">คำนำหน้า</option>
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ผ.ศ">ผศ.</option>
                    <option value="ด.ต">ดร.</option>
                    <option value="รศ.">รศ.</option>
                    <option value="ศ.">ศ.</option>
                  </select>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="ชื่อ"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="นามสกุล"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                {/* Row 2: Position + Faculty */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    name="faculty"
                    value={formData.faculty}
                    placeholder="ตำแหน่ง"
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <input
                    type="text"
                    name="jobTitle"
                    placeholder="คณะ/หน่วยงาน"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                {/* Row 3: Phone + Workplace */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    name="mobilePhone"
                    placeholder="เบอร์โทรศัพท์"
                    value={formData.mobilePhone}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <input
                    type="text"
                    name="officeLocation"
                    placeholder="สถานที่ทำงาน"
                    value={formData.officeLocation}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              {!isEditMode ? (
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  แก้ไข
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    ยกเลิก
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
