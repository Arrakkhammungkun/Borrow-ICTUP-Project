// /src/components/CreateProfileContent.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { useUser } from "@/contexts/UserContext";

export default function CreateProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const { setUser } = useUser();
  const dataParamRef = useRef(dataParam);
  const titles = ["นาย", "นาง", "นางสาว", "ผศ.", "รศ.", "ดร.", "ศ."];

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
        first_name: "",
        last_name: "",
        title: initialData.title || "",
        prefix: initialData.prefix || "",
        jobTitle: "",
        mobilePhone: initialData.mobilePhone || "",
        officeLocation: "",
        
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
    if (!dataParamRef.current) {
      console.error("Token or data is missing", {
        dataParam: dataParamRef.current,
      });
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "Token หรือข้อมูลเริ่มต้นขาดหาย",
      });
      return;
    }

    const requiredFields = ["first_name", "last_name", "jobTitle"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        const userRes = await fetch("/api/me", { credentials: "include" });
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
          router.push("/Craete_loanlist");
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
    <div className="flex justify-center mx-auto mt-4 p-6">
      <div className="bg-white/30 backdrop-blur-xs p-8 rounded-lg shadow-lg w-full max-w-4xl h-fit">
        <h1 className="text-2xl text-[#4682B4] mb-4 text-center">
          สร้างโปรไฟล์
        </h1>
        <div className="border-b border-gray-500 mb-6"></div>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-black p-2 text-base"
        >
          {/* <input
            type="text"
            value={formData.prefix}
            onChange={(e) =>
              setFormData({ ...formData, prefix: e.target.value })
            }
            placeholder="คำนำหน้า (เช่น นาย)"
            className="p-2 border rounded w-full"
            required
          /> */}

          <select
            required
            name="prefix"
            value={formData.prefix}
            onChange={handleFormChange}
            className={`border  px-3 py-2 rounded w-auto focus:outline-none focus:ring-2  transition duration-200 ease-in-out
                    ${formData.prefix === "" ? "text-[#7C7D7D]" : "text-black"}`}
          >
            <option value="">คำนำหน้า</option>
            {titles.map((t, i) => (
              <option key={i} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            placeholder="ชื่อ"
            className="p-2 border rounded w-full"
            required
          />
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            placeholder="นามสกุล"
            className="p-2 border rounded w-full"
            required
          />
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="ตำแหน่ง"
            className="p-2 border rounded w-full"
          />
          <select
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleFormChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- เลือกสาขา --</option>
            <option value="คอมพิวเตอร์ธุรกิจ">คอมพิวเตอร์ธุรกิจ</option>
            <option value="วิศวกรรมคอมพิวเตอร์">วิศวกรรมคอมพิวเตอร์</option>
            <option value="ธุรกิจดิจิทัล">ธุรกิจดิจิทัล</option>
            <option value="วิศวกรรมซอฟต์แวร์">วิศวกรรมซอฟต์แวร์</option>
            <option value="วิทยาการคอมพิวเตอร์">วิทยาการคอมพิวเตอร์</option>
            <option value="วิทยาการข้อมูลและการประยุกต์">วิทยาการข้อมูลและการประยุกต์</option>
            <option value="เทคโนโลยีสารสนเทศ">เทคโนโลยีสารสนเทศ</option>
            <option value="ภูมิสารสนเทศศาสตร์">ภูมิสารสนเทศศาสตร์</option>
            <option value="คอมพิวเตอร์กราฟิกและมัลติมีเดีย">คอมพิวเตอร์กราฟิกและมัลติมีเดีย</option>
            <option value="เจ้าหน้าที่">เจ้าหน้าที่คณะเทคโนโลยีสารสนเทศ</option>
          </select>
          <input
            type="text"
            value={formData.mobilePhone}
            onChange={(e) =>
              setFormData({ ...formData, mobilePhone: e.target.value })
            }
            placeholder="เบอร์โทรศัพท์"
            className="p-2 border rounded w-full"
          />
          <div className="col-span-1 sm:col-span-2 md:col-span-3">
            <input
              type="text"
              value={formData.officeLocation}
              onChange={(e) =>
                setFormData({ ...formData, officeLocation: e.target.value })
              }
              placeholder="สถานที่ทำงาน"
              className="p-2 border rounded max-w-56"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 flex justify-center gap-6">
            <button
              type="submit"
              className="px-4 py-2 bg-[#2B7EFD] text-white rounded w-40 transition hover:bg-blue-600 cursor-pointer"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={() => console.log("ยกเลิก")}
              className="px-4 py-2 bg-[#E74C3C] text-white rounded w-40 transition hover:bg-[#D04537] cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
