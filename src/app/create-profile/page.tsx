"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { useUser } from "@/contexts/UserContext";
export default function CreateProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const { setUser } = useUser();
  // ใช้ useRef เพื่อเก็บ dataParam อย่างถาวร
  const dataParamRef = useRef(dataParam);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    title: "",
    prefix: "",
    jobTitle: "",
    mobilePhone: "",
    officeLocation: "",
  });

  useEffect(() => {
    if (!dataParam) {
      console.log("No dataParam, redirecting to /Login");
      router.push("/Login");
      return;
    }

    try {
      const initialData = JSON.parse(decodeURIComponent(dataParam));
    
      if (!initialData.upId || !initialData.email) {
        throw new Error("Missing required fields in initialData");
      }
      setFormData({
        first_name: initialData.firstName || "",
        last_name: initialData.lastName || "",
        title: initialData.title || "",
        prefix: initialData.prefix || "",
        jobTitle: initialData.jobTitle || "",
        mobilePhone: initialData.mobilePhone || "",
        officeLocation: initialData.officeLocation || "",
      });
    } catch (error) {
      console.error("Failed to parse initial data:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ข้อมูลเริ่มต้นไม่ถูกต้อง",
      }).then(() => {
        router.push("/Login");
      });
    }
  }, [dataParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ตรวจสอบและ debug cookie
    // const cookies = document.cookie.split("; ").map((row) => row.trim());
    // console.log("All cookies:", cookies);
    // const tokenCookie = cookies.find((row) => row.startsWith("auth_token="));
    // const token = tokenCookie ? tokenCookie.split("=")[1] : null;

    if (!dataParamRef.current) {
      console.error("Token or data is missing", {  dataParam: dataParamRef.current });
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "Token หรือข้อมูลเริ่มต้นขาดหาย",
      });
      return;
    }

    const requiredFields = ["first_name", "last_name", "jobTitle"];
    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      Swal.fire({
        icon: "error",
        title: "กรุณากรอกข้อมูลให้ครบ",
        text: `ฟิลด์ที่ขาด: ${missingFields.join(", ")}`,
      });
      return;
    }

    let upId: string, email: string;
    try {
      const parsedData = JSON.parse(decodeURIComponent(dataParamRef.current));
      upId = parsedData.upId;
      email = parsedData.email;
      if (!upId || !email) throw new Error("Missing upId or email in data");
      
    } catch (error) {
      console.error("Failed to parse data:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ข้อมูลไม่ถูกต้อง",
      });
      return;
    }

    const payload = {
      ...formData,
      up_id: upId,
      email,
      displayName: `${formData.first_name} ${formData.last_name}`,
    };

    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json",  },
        
        //"Authorization": `Bearer ${token}`
        credentials:"include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          },
        });
        await Toast.fire({
          icon: "success",
          title: "สร้างบัญชีสำเร็จ",
        });
          const userRes =await fetch("/api/me",{credentials:"include"})
          if(userRes.ok){
            const data = await userRes.json();
            setUser(data.user)
            router.push("/AddItem");
          }
      } else {
        console.error("Failed to create profile:", result.error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: result.error || "ไม่สามารถสร้างโปรไฟล์ได้",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
      });
    }

  };

  return (
    <div className="container mx-auto mt-4">
      <div className="bg-blue-100 text-center">
        <h1>สร้างโปรไฟล์</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="ชื่อ"
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="นามสกุล"
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="ตำแหน่ง"
            className="p-2 border rounded"
          />
          <input
            type="text"
            value={formData.prefix}
            onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
            placeholder="คำนำหน้า (เช่น นาย)"
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            placeholder="ตำแหน่ง"
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            value={formData.mobilePhone}
            onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
            placeholder="เบอร์โทรศัพท์"
            className="p-2 border rounded"
          />
          <input
            type="text"
            value={formData.officeLocation}
            onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
            placeholder="สถานที่ทำงาน"
            className="p-2 border rounded"
          />
          <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            บันทึกโปรไฟล์
          </button>
        </form>
      </div>
    </div>
  );
}