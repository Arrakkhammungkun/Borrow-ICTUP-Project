
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { Equipment } from "@/types/equipment";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function EquipmentInstanceSelection() {
  const params = useParams();
  const id = String(params.id); // แปลง id เป็น string
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [selectedInstances, setSelectedInstances] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลด selectedInstances จาก localStorage ใน client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBorrowData = localStorage.getItem("borrowData");
      if (savedBorrowData) {
        const borrowData = JSON.parse(savedBorrowData);
        console.log("Initial localStorage borrowData:", borrowData);
        if (borrowData.equipmentId == id && borrowData.selectedInstances) {
          const instanceIds = borrowData.selectedInstances.map((instance: any) => instance.id);
          console.log("Initial selectedInstances from localStorage:", instanceIds);
          setSelectedInstances(instanceIds);
        }
      }
    }
  }, [id]);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/instance/user/equipments/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch equipment");
        }
        const data = await res.json();
        console.log("Fetched equipment:", data);
        setEquipment(data);
        setLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถดึงข้อมูลอุปกรณ์ได้",
          icon: "error",
        });
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  const handleSelectInstance = (instanceId: number) => {
    let updatedInstances: number[];
    if (selectedInstances.includes(instanceId)) {
      updatedInstances = selectedInstances.filter((id) => id !== instanceId);
    } else {
      updatedInstances = [...selectedInstances, instanceId];
    }
    setSelectedInstances(updatedInstances);
    console.log("Updated selectedInstances:", updatedInstances);

    // อัปเดต localStorage
    if (typeof window !== "undefined") {
      if (updatedInstances.length === 0) {
        localStorage.removeItem("borrowData");
        console.log("Removed borrowData from localStorage");
      } else {
        const selectedInstanceDetails = equipment?.instances
          ?.filter((instance) => updatedInstances.includes(instance.id))
          .map((instance) => ({
            id: instance.id,
            serialNumber: instance.serialNumber,
            status: instance.status,
            location: instance.location || "-",
            note: instance.note || "-",
          }));

        const borrowData = {
          equipmentId: equipment?.id,
          equipmentName: equipment?.name,
          equipmentCode: equipment?.code,
          equipmentUnit: equipment?.unit,
          equipmentOwner: equipment?.owner,
          selectedInstances: selectedInstanceDetails || [],
        };

        localStorage.setItem("borrowData", JSON.stringify(borrowData));
        console.log("Updated borrowData in localStorage:", borrowData);
      }
    }
  };

  const handleAutoSelect = () => {
    if (!equipment?.isIndividual || !equipment.instances) return;

    const availableInstances = equipment.instances
      .filter((instance) => instance.status === "AVAILABLE")
      .map((instance) => instance.id);

    if (availableInstances.length === 0) {
      Swal.fire({
        title: "ไม่มีอุปกรณ์ว่าง",
        text: "ไม่มีรายการที่สามารถเลือกได้อัตโนมัติ",
        icon: "warning",
      });
      return;
    }

    setSelectedInstances(availableInstances);
    console.log("Auto-selected instances:", availableInstances);

    // อัปเดต localStorage
    if (typeof window !== "undefined") {
      const selectedInstanceDetails = equipment.instances
        .filter((instance) => availableInstances.includes(instance.id))
        .map((instance) => ({
          id: instance.id,
          serialNumber: instance.serialNumber,
          status: instance.status,
          location: instance.location || "-",
          note: instance.note || "-",
        }));

      const borrowData = {
        equipmentId: equipment?.id,
        equipmentName: equipment?.name,
        equipmentCode: equipment?.code,
        equipmentUnit: equipment?.unit,
        equipmentOwner: equipment?.owner,
        selectedInstances: selectedInstanceDetails,
      };

      localStorage.setItem("borrowData", JSON.stringify(borrowData));
      console.log("Updated borrowData in localStorage (auto-select):", borrowData);
    }
  };

  const handleConfirmBorrow = async () => {
    if (selectedInstances.length === 0) {
      Swal.fire({
        title: "กรุณาเลือกรายการ",
        text: "ต้องเลือกอย่างน้อย 1 รายการเพื่อยืม",
        icon: "warning",
      });
      return;
    }

    // อัปเดต localStorage ก่อนไปหน้าถัดไป
    if (typeof window !== "undefined") {
      const selectedInstanceDetails = equipment?.instances
        ?.filter((instance) => selectedInstances.includes(instance.id))
        .map((instance) => ({
          id: instance.id,
          serialNumber: instance.serialNumber,
          status: instance.status,
          location: instance.location || "-",
          note: instance.note || "-",
        }));

      const borrowData = {
        equipmentId: equipment?.id,
        equipmentName: equipment?.name,
        equipmentCode: equipment?.code,
        equipmentUnit: equipment?.unit,
        equipmentOwner: equipment?.owner,
        selectedInstances: selectedInstanceDetails || [],
      };

      localStorage.setItem("borrowData", JSON.stringify(borrowData));
      console.log("Saved borrowData before navigation:", borrowData);
    }

    router.push(`/Craete_form/${equipment?.id}`);
  };

  const handleBack = () => {
    router.push("/Craete_loanlist");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-2 rounded flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>กลับ</span>
            </button>
            {loading && <FullScreenLoader />}
            <h1 className="text-2xl font-bold text-[#4682B4]">
              เลือกรายการ {equipment?.name}
            </h1>
          </div>
          <hr className="mb-6 border-[#DCDCDC]" />
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FullScreenLoader />
            </div>
          ) : !equipment || !equipment.isIndividual ? (
            <div className="flex justify-center items-center h-64">
              <FullScreenLoader />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-base font-medium">
                  เจ้าของ: {equipment.owner}
                </p>
                <p className="text-base font-medium">
                  รายละเอียด: {equipment.description}
                </p>
                <p className="text-base font-medium">หมวดหมู่: {equipment.category}</p>
                <p className="text-base font-medium">หน่วย: {equipment.unit}</p>
                <p className="text-base font-medium">
                  จำนวนว่าง: {equipment.available}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-black text-xs sm:text-sm divide-y divide-black">
                  <thead>
                    <tr className="bg-[#2B5279] text-white text-left divide-x divide-black">
                      <th className="p-1 sm:p-2 border text-center">เลือก</th>
                      <th className="p-1 sm:p-2 border">Serial Number</th>
                      <th className="p-1 sm:p-2 border">สถานะ</th>
                      <th className="p-1 sm:p-2 border">ที่เก็บ</th>
                      <th className="p-1 sm:p-2 border">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {equipment.instances.map((instance) => (
                      <tr key={instance.id} className="divide-x divide-black">
                        <td className="p-1 sm:p-2 border text-center">
                          <input
                            type="checkbox"
                            checked={selectedInstances.includes(instance.id)}
                            onChange={() => handleSelectInstance(instance.id)}
                            disabled={instance.status !== "AVAILABLE"}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="p-1 sm:p-2 border">{instance.serialNumber}</td>
                        <td className="p-1 sm:p-2 border">
                          {instance.status === "AVAILABLE"
                            ? "ว่าง"
                            : instance.status === "IN_USE"
                            ? "ถูกยืม"
                            : instance.status}
                        </td>
                        <td className="p-1 sm:p-2 border">{instance.location || "-"}</td>
                        <td className="p-1 sm:p-2 border">{instance.note || "-"}</td>
                      </tr>
                    ))}
                    {equipment.instances.length === 0 && (
                      <tr>
                        <td className="p-2 border text-center" colSpan={5}>
                          ไม่มีรายการอุปกรณ์
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-base font-medium">
                  เลือกแล้ว: {selectedInstances.length} รายการ
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleAutoSelect}
                    className="bg-[#3498DB] hover:bg-[#2980B9] text-white px-3 py-2 rounded flex items-center gap-2 text-sm sm:text-base"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} />
                    <span>เลือกทั้งหมด</span>
                  </button>
                  <button
                    onClick={handleConfirmBorrow}
                    className="bg-[#25B99A] hover:bg-[#2d967f] text-white px-3 py-2 rounded flex items-center gap-2 text-sm sm:text-base"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} />
                    <span>ยืนยันการยืม</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
