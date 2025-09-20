"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import type { Borrowing } from "@/types/borrowing";
import Swal from "sweetalert2";
import FullScreenLoader from "@/components/FullScreenLoader";



export default function BorrowDetailPage() {
  
  const { id } = useParams();
  const router = useRouter();
  const [detail, setDetail] = useState<Borrowing | null>(null);

  const [loading, setLoading] = useState(true);
  
  const fetchDetail = async () => {
    if (!id) {
      setLoading(false);
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/borrowings?type=owner&search=${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.length > 0) {
          setDetail(json[0]);
        } else {
          console.error("No data found");
          setDetail(null);
        }
      } else {
        console.error("Failed to fetch detail");
        setDetail(null);
      }
    } catch (error) {
      console.error(error);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    } else {
      setLoading(false);
      setDetail(null);
    }
  }, [id]);

  const formatThaiDate = (isoDate :string | null) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const getStatusThai = (status:Borrowing["status"]) => {
    switch (status) {
      case "PENDING":
        return "รออนุมัติ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ไม่อนุมัติ";
      default:
        return status;
    }
  };

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการอนุมัติคำขอยืมนี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, อนุมัติ",
      cancelButtonText: "ยกเลิก",
    });
    if(result.isConfirmed){
      setLoading(true);
      try {
        const res = await fetch("/api/borrowings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ borrowingId: Number(id), action: "approve" }),
        });
        if (res.ok) {
          setLoading(false);
          await Swal.fire("สำเร็จ!", "อนุมัติเรียบร้อยแล้ว", "success");
          await fetchDetail();
          router.push("/Approval");
        } else {
          setLoading(false);
          const errorData = await res.json();
          Swal.fire("ผิดพลาด!", errorData.error || "Failed to reject", "error");
          
        }
      } catch (error) {
        setLoading(false);
        console.error(error);
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในการไม่อนุมัติ", "error");
        
      } 
  };
  }


  const handleReject = async () => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการไม่อนุมัติคำขอยืมนี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ไม่อนุมัติ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await fetch("/api/borrowings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ borrowingId: Number(id), action: "reject" }),
        });

        if (res.ok) {
          setLoading(false);
          await Swal.fire("สำเร็จ!", "ไม่อนุมัติเรียบร้อยแล้ว", "success");

          await fetchDetail();
          router.push("/Approval");
        } else {
          setLoading(false);
          const errorData = await res.json();
          Swal.fire("ผิดพลาด!", errorData.error || "Failed to reject", "error");
        }
      } catch (error) {
        setLoading(false);
        console.error(error);
        Swal.fire("ผิดพลาด!", "เกิดข้อผิดพลาดในการไม่อนุมัติ", "error");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Navbar />
      <div className="flex flex-1 p-2">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 mt-16 text-black border rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-[#4682B4]">
            รายละเอียด รายการยืมอุปกรณ์
          </h1>
          {loading && <FullScreenLoader />}
          {!detail ? (
            <div className="flex justify-center my-2 bg-white shadow rounded-lg p-4 sm:p-6 mb-6 md:gap-20">
              <div className="text-center">ไม่พบข้อมูล</div>
            </div>
          ) : (
            <>
              {/* Card ข้อมูลผู้ยืม */}
              <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 flex flex-col md:flex-row md:justify-between md:gap-20">

                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">เลขที่ใบยืม :</span>{" "}
                    {detail.id}
                  </p>
                  <p>
                    <span className="font-semibold">ชื่อผู้ขอยืม :</span>{" "}
                    {detail.borrower_firstname } {detail.borrower_lastname}
                  </p>
                  <p>
                    <span className="font-semibold">ตำแหน่ง :</span>{" "}
                    {detail?.borrower?.jobTitle || "ไม่ระบุ"}
                  </p>
                  <p>
                    <span className="font-semibold">คณะ/กอง/ศูนย์ :</span>{" "}
                    {detail?.details[0].department || "ไม่ระบุ"}
                  </p>
                </div>

                <div className="space-y-2 mt-4 md:mt-0">
                  <p>
                    <span className="font-semibold">วันที่ยืม :</span>{" "}
                    {formatThaiDate(detail.requestedStartDate)}
                  </p>
                  <p>
                    <span className="font-semibold">กำหนดส่งคืน :</span>{" "}
                    {formatThaiDate(detail.dueDate)}
                  </p>
                  <p>
                    <span className="font-semibold">สถานที่นำไปใช้ :</span>{" "}
                    {detail.location || "ไม่ระบุ"}
                  </p>
                  <p>
                    <span className="font-semibold">เบอร์ :</span>{" "}
                    {detail.borrower.mobilePhone || "ไม่ระบุ"}
                  </p>
                </div>
              </div>

              {/* ปุ่ม */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
                <div className="flex gap-3">
                  {detail.details.every(
                    (d) => d.approvalStatus === "PENDING"
                  ) ? (
                    <>
                      <button
                        onClick={handleApprove}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full sm:w-auto"
                      >
                        อนุมัติยืม
                      </button>
                      <button
                        onClick={handleReject}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full sm:w-auto"
                      >
                        ไม่อนุมัติ
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-600">
                      สถานะ:{" "}
                      {getStatusThai(detail.details[0]?.approvalStatus)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.back()}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto"
                >
                  ย้อนกลับ
                </button>
              </div>

              {/* ตารางรายการอุปกรณ์ */}
              <div className="overflow-x-auto bg-white shadow rounded-lg">
                <table className="w-full border-collapse text-sm sm:text-base">
                  <thead>
                    <tr className="bg-[#2B5279] text-white">
                      <th className="p-2 sm:p-3 border">รหัส</th>
                      <th className="p-2 sm:p-3 border">ชื่ออุปกรณ์</th>
                      <th className="p-2 sm:p-3 border">จำนวนที่ยืม</th>
                      <th className="p-2 sm:p-3 border">หน่วย</th>
                      <th className="p-2 sm:p-3 border">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.details.map((item, index) => (
                      <tr
                        key={index}
                        className="text-center bg-white hover:bg-gray-100"
                      >
                        <td className="p-2 border">
                          {item.equipment.equipment_id}
                        </td>
                        <td className="p-2 border text-left">
                          {item.equipment.name}
                          <br />
                            <span className="text-xs sm:text-sm text-blue-500">
                              จำนวนที่มีอยู่ในคลัง :{" "}
                              {item.approvalStatus === "APPROVED"
                                ? item.equipment.availableQuantity
                                : item.approvalStatus === "PENDING"
                                ? item.equipment.availableQuantity + item.quantityBorrowed
                                : item.equipment.availableQuantity}{" "}
                              {item.equipment.unit}
                            </span>

                        </td>
                        <td className="p-2 border">{item.quantityBorrowed}</td>
                        <td className="p-2 border">{item.equipment.unit}</td>
                        <td className="p-2 border">
                          {item.note || detail.reason || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
