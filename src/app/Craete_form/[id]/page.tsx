"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import Swal from "sweetalert2";
import { useSearchParams, useParams,useRouter } from "next/navigation";


interface EquipmentItem {
  id: number;
  code: string;
  name: string;
  owner: string;
  quantity: number;
  unit:string;
}


export default function CreateBorrowForm() {

  const params = useParams(); // ดึงจาก path
  const searchParams = useSearchParams(); // ดึงจาก query string
  const id = params.id; // /Craete_form/[id]
  const qty = searchParams.get("qty"); // ?qty=1
  const router =useRouter()
  const [formData, setFormData] = useState({
    title: "",
    firstname: "",
    lastname: "",
    position: "",
    department: "",
    usageLocation: "",
    purpose: "",
    startDate: "",
    endDate: "",
    returnDate: "",
  });

  // รายการอุปกรณ์ (รับจาก router state หรือเริ่มต้นว่าง)
  const [borrowItems, setBorrowItems] = useState<EquipmentItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("borrowItems");
    if (saved) {
      setBorrowItems(JSON.parse(saved));
    }
  }, []);

  //  เวลา state เปลี่ยน → เซฟลง localStorage
  // useEffect(() => {
  //   localStorage.setItem("borrowItems", JSON.stringify(borrowItems));

  // }, [borrowItems]);

  // โหลดข้อมูลรายการยืมจาก router state (ถ้ามี)

useEffect(() => {
  if (!id) return;

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/equipments/${id}`);
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await res.json();
      console.log("Respone",data)
      // เอาค่าจำนวน (qty) จาก query string มาใส่ใน item ด้วย
      const itemWithQty = {
        ...data,
        quantity: qty ? parseInt(qty) : 1,
      };

      setBorrowItems([itemWithQty]);
    } catch (err) {
      console.error(err);
      Swal.fire("ผิดพลาด", "โหลดข้อมูลอุปกรณ์ไม่สำเร็จ", "error");
    }
  };

  fetchData();
}, [id, qty]);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // วันปัจจุบัน + 7 วัน
  const getTodayPlus = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };

  // วันคืนสูงสุด = startDate + 15 วัน
  const getMaxReturnDate = (startDate: string) => {
    if (!startDate) return "";
    const date = new Date(startDate);
    date.setDate(date.getDate() + 15);
    return formatDate(date);
  };

  // จัดการเปลี่ยนแปลง input ฟอร์ม
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // ถ้าเปลี่ยน startDate ต้องล้าง endDate และ returnDate ถ้าเกินกำหนด
    if (name === "startDate") {
      let newEndDate = formData.endDate;
      let newReturnDate = formData.returnDate;

      if (newEndDate) {
        const maxEnd = new Date(value);
        maxEnd.setDate(maxEnd.getDate() + 15);
        if (new Date(newEndDate) > maxEnd) newEndDate = "";
      }
      if (newReturnDate) {
        const maxRet = new Date(value);
        maxRet.setDate(maxRet.getDate() + 15);
        if (new Date(newReturnDate) > maxRet) newReturnDate = "";
      }

      setFormData((prev) => ({
        ...prev,
        startDate: value,
        endDate: newEndDate,
        returnDate: newReturnDate,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("formData ก่อนส่ง:", formData);
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const returnDate = new Date(formData.returnDate);

    // เช็ควันที่ต้องกรอกครบ
    if (!formData.startDate || !formData.endDate || !formData.returnDate) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกวันที่ให้ครบ", "warning");
      return;
    }

    // ต้องจองล่วงหน้าอย่างน้อย 7 วัน
    const diffFromToday = Math.ceil(
      (new Date(formData.startDate).getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    if (diffFromToday < 7) {
      Swal.fire(
        "แจ้งเตือน",
        "กรุณาจองล่วงหน้าอย่างน้อย 7 วันก่อนวันเริ่มยืม",
        "warning"
      );
      return;
    }

    // ยืมได้ไม่เกิน 15 วัน
    const diffBorrow = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffBorrow > 15) {
      Swal.fire("แจ้งเตือน", "ไม่สามารถยืมเกิน 15 วันได้", "warning");
      return;
    }

    // วันที่คืนต้องไม่เกิน 15 วัน และไม่ก่อนวันเริ่ม
    const diffReturn = (returnDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffReturn > 15 || diffReturn < 0) {
      Swal.fire(
        "แจ้งเตือน",
        "วันส่งคืนต้องอยู่ภายใน 15 วัน และไม่ควรก่อนวันเริ่มยืม",
        "warning"
      );
      return;
    }

    // ตรวจสอบว่ามีรายการอุปกรณ์อย่างน้อย 1 รายการ
    if (borrowItems.length === 0) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือกอุปกรณ์ที่ต้องการยืมอย่างน้อย 1 รายการ", "warning");
      return;
    }

    // ตรวจสอบรายการอุปกรณ์ว่าแต่ละรายการมีข้อมูลครบ
    for (let i = 0; i < borrowItems.length; i++) {
      const item = borrowItems[i];
      if (!item.name || !item.quantity || !item.code) {
        Swal.fire("แจ้งเตือน", `กรุณากรอกข้อมูลอุปกรณ์ในรายการที่ ${i + 1} ให้ครบ`, "warning");
        return;
      }
    }



    console.log("ข้อมูลฟอร์ม:", formData);
    console.log("รายการยืม:", borrowItems);

    try {
      const res = await fetch('/api/borrowings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: borrowItems[0].id,
          quantity: borrowItems[0].quantity,
          startDate: formData.startDate,
          endDate: formData.endDate,
          returnDate: formData.returnDate,
          purpose: formData.purpose,
          usageLocation: formData.usageLocation,
          department:formData.department,
          title:formData.title,
          firstname:formData.firstname,
          lastname:formData.lastname,
          position:formData.position
         
        }),
        credentials: 'include' 
      });

      if (!res.ok) {
        const error = await res.json();
        Swal.fire('Error', error.error || 'Failed to submit', 'error');
        return;
      }

      await Swal.fire('สำเร็จ', 'ส่งคำขอยืมสำเร็จ', 'success');
        setFormData({
          title: "",
          firstname: "",
          lastname: "",
          position: "",
          department: "",
          usageLocation: "",
          purpose: "",
          startDate: "",
          endDate: "",
          returnDate: "",
        });
        setBorrowItems([]);
        localStorage.removeItem("borrowItems");
        router.push('/LoanList')
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      Swal.fire("ผิดพลาด", "โหลดข้อมูลอุปกรณ์ไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="min-h-screen flex">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-xl font-bold text-[#4682B4] mb-2">สร้างรายการยืม</h1>
          <hr className="mb-4 border-[#DCDCDC]" />

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* ข้อมูลผู้ยืม */}
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="คำนำหน้า"
                className="border px-2 py-1 rounded"
              />
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleFormChange}
                placeholder="ชื่อ"
                className="border px-2 py-1 rounded"
              />
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleFormChange}
                placeholder="นามสกุล"
                className="border px-2 py-1 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleFormChange}
                placeholder="ตำแหน่ง"
                className="border px-2 py-1 rounded"
              />
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                placeholder="คณะ/กอง/ศูนย์"
                className="border px-2 py-1 rounded"
              />
            </div>

            <input
              type="text"
              name="usageLocation"
              value={formData.usageLocation}
              onChange={handleFormChange}
              placeholder="สถานที่นำไปใช้"
              className="w-full border px-2 py-1 rounded"
            />

            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleFormChange}
              placeholder="เพื่อใช้ในงาน"
              className="w-full border px-2 py-1 rounded"
              rows={3}
            />

            {/* วันที่ */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">ระหว่างวันที่ (ต้องล่วงหน้าอย่างน้อย 7 วัน)</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="w-full border px-2 py-1 rounded"
                  required
                  min={getTodayPlus(7)}
                />
              </div>
              <div>
                <label className="block mb-1">ถึงวันที่ (ไม่เกิน 15 วัน)</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  className="w-full border px-2 py-1 rounded"
                  required
                  min={formData.startDate}
                  max={getMaxReturnDate(formData.startDate)}
                  disabled={!formData.startDate}
                />
              </div>
              <div>
                <label className="block mb-1">ส่งคืนภายใน (ไม่เกิน 15 วัน)</label>
                <input
                  type="date"
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={handleFormChange}
                  className="w-full border px-2 py-1 rounded"
                  required
                  min={formData.startDate}
                  max={getMaxReturnDate(formData.startDate)}
                  disabled={!formData.startDate}
                />
              </div>
            </div>

            {/* รายการยืม */}
            <div>
              <h2 className="font-bold mt-6 mb-2">รายการที่ต้องการยืมทั้งหมด</h2>
              {borrowItems.length === 0 ? (
                <p className="text-red-500">ยังไม่มีรายการที่เลือก</p>
              ) : (
                <table className="w-full table-auto border text-sm">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="border px-2">ที่</th>
                      <th className="border px-2">รายการ</th>
                      <th className="border px-2">จำนวน</th>
                      <th className="border px-2">หน่วย</th>
                      <th className="border px-2">หมายเลขพัสดุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border text-center">{index + 1}</td>
                        <td className="border px-2">{item.name ||  "-"}</td>
                        <td className="border px-2 text-center">{qty}</td>
                        <td className="border px-2 text-center">{item.unit || "-"}</td>
                        <td className="border px-2 text-center">{item.code || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => window.history.back()}
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                ยืนยันการยืม
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              **หากพัสดุ / ครุภัณฑ์
              ที่นำมายืมคืนมีการชำรุดเสียหายหรือใช้การไม่ได้ หรือสูญหาย
              ผู้รับผิดชอบจะต้องชดใช้ตามสภาพเดิม
              หรือจ่ายชดใช้ตามเงื่อนไขที่หน่วยงานกำหนด
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
