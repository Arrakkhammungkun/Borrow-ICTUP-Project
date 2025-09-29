"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import FullScreenLoader from "@/components/FullScreenLoader";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/SideBar";
import Swal from "sweetalert2";
import { Equipment } from "@/types/equipment";

export default function ItemList() {
  const params = useParams();
  const id = params?.id as string;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [formData, setFormData] = useState({
    serialNumber: "",
    status: "",
    location: "",
    note: "",
  });
  const router = useRouter();

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`/api/AddItem/equipments/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch equipment");
      }
      const data = await response.json();
      setEquipment(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      await Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: err.message || "ไม่สามารถดึงข้อมูลอุปกรณ์ได้",
        icon: "error",
        draggable: true,
      });
      router.push("/Equipmentlist")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่พบรหัสอุปกรณ์",
        icon: "error",
        draggable: true,
      });
      router.push("/Equipmentlist");
      return;
    }
    fetchEquipment();
  }, [id, router]);

  const openEditModal = (instance: any) => {
    setSelectedInstance(instance);
    setFormData({
      serialNumber: instance.serialNumber,
      status: instance.status,
      location: instance.location || "",
      note: instance.note || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInstance(null);
    setFormData({ serialNumber: "", status: "", location: "", note: "" });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/AddItem/editItemNew/${id}/instances/${selectedInstance.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setIsSubmitting(false);
        throw new Error(errorData.message || "Failed to update instance");
      }

      await fetchEquipment();
      closeModal();
      setIsSubmitting(false);
      await Swal.fire({
        title: "อัปเดตรายการสำเร็จ!",
        icon: "success",
        draggable: true,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      await Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: err.message || "เกิดข้อผิดพลาดในการอัปเดต",
        icon: "error",
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (instanceId: number) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "การลบรายการนี้จะไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E74C3C",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
      draggable: true,
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/AddItem/editItemNew/${id}/instances/${instanceId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setIsSubmitting(false);
        throw new Error(errorData.message || "Failed to delete instance");
      }

      await fetchEquipment(); 
      setIsSubmitting(false);
      await Swal.fire({
        title: "ลบรายการสำเร็จ!",
        icon: "success",
        draggable: true,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      await Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: err.message || "เกิดข้อผิดพลาดในการลบ",
        icon: "error",
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 max-w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50 max-w-full">
          {(loading || isSubmitting) && <FullScreenLoader />}
          {equipment && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-[#4682B4]">
                  {equipment.name} (รหัส: {equipment.code})
                </h1>
                <button
                  onClick={() => router.push("/Equipmentlist")}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  กลับ
                </button>
              </div>
              <hr className="mb-6 border-[#DCDCDC]" />

              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">
                      <strong>หมวดหมู่:</strong> {equipment.category}
                    </p>
                    <p className="text-sm">
                      <strong>สถานะ:</strong>{" "}
                      <span
                        className={`${
                          equipment.status === "ยืมได้"
                            ? "text-green-600"
                            : equipment.status === "อยู่ระหว่างยืม"
                              ? "text-blue-600"
                              : "text-red-600"
                        }`}
                      >
                        {equipment.status}
                      </span>
                    </p>
                    <p className="text-sm">
                      <strong>ที่เก็บ:</strong> {equipment.location}
                    </p>
                    <p className="text-sm">
                      <strong>คำอธิบาย:</strong> {equipment.description || "ไม่มี"}
                    </p>
                    <p className="text-sm">
                      <strong>หน่วย:</strong> {equipment.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>ทั้งหมด:</strong> {equipment.all} {equipment.unit}
                    </p>
                    <p className="text-sm">
                      <strong>พร้อมใช้งาน:</strong> {equipment.available}{" "}
                      {equipment.unit}
                    </p>
                    <p className="text-sm">
                      <strong>กำลังใช้งาน:</strong> {equipment.used}{" "}
                      {equipment.unit}
                    </p>
                    <p className="text-sm">
                      <strong>ชำรุด:</strong> {equipment.broken} {equipment.unit}
                    </p>
                    <p className="text-sm">
                      <strong>สูญหาย:</strong> {equipment.lost} {equipment.unit}
                    </p>
                  </div>
                </div>
              </div>

              {equipment.isIndividual && (
                <div className="rounded overflow-x-auto bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#4682B4]">
                      รายการของจริง
                    </h2>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/equipment/${equipment.id}/create-items`}>
                        <button className="bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-teal-600 text-sm">
                          เพิ่มของจริง
                        </button>
                      </Link>
                    </div>
                  </div>
                  <table className="min-w-full table-auto text-sm border border-gray-200">
                    <thead className="bg-[#2B5279] text-white">
                      <tr>
                        <th className="px-4 py-3 text-left border-r">
                          Serial Number
                        </th>
                        <th className="px-4 py-3 text-center border-r">สถานะ</th>
                        <th className="px-4 py-3 text-center border-r">ที่เก็บ</th>
                        <th className="px-4 py-3 text-center">หมายเหตุ</th>
                        <th className="px-4 py-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.instances.length > 0 ? (
                        equipment.instances.map((instance) => (
                          <tr key={instance.id} className="border-t">
                            <td className="px-4 py-3 border-r">
                              {instance.serialNumber}
                            </td>
                            <td className="px-4 py-3 text-center border-r">
                              <span
                                className={`${
                                  instance.status === "AVAILABLE"
                                    ? "text-green-600"
                                    : instance.status === "IN_USE"
                                      ? "text-blue-600"
                                      : instance.status === "BROKEN" ||
                                        instance.status === "LOST"
                                        ? "text-red-600"
                                        : "text-gray-600"
                                }`}
                              >
                                {instance.status === "AVAILABLE"
                                  ? "พร้อมใช้งาน"
                                  : instance.status === "IN_USE"
                                    ? "กำลังใช้งาน"
                                    : instance.status === "BROKEN"
                                      ? "ชำรุด"
                                      : instance.status === "LOST"
                                        ? "สูญหาย"
                                        : "ไม่พร้อมใช้งาน"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center border-r">
                              {instance.location || "ไม่ระบุ"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {instance.note || "ไม่มี"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => openEditModal(instance)}
                                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm mr-2"
                              >
                                ✏️ แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(instance.id)}
                                className="bg-[#E74C3C] px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm hover:bg-[#b24236] text-white cursor-pointer"
                              >
                                🗑️ ลบ
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="border px-4 py-3 text-center text-gray-500"
                          >
                            ยังไม่มีรายการของจริง
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Edit Modal */}
              {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-lg font-bold mb-4 text-[#4682B4]">
                      แก้ไขรายการของจริง
                    </h2>
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          name="serialNumber"
                          value={formData.serialNumber}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded text-sm"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          สถานะ
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded text-sm"
                          required
                        >
                          <option value="AVAILABLE">พร้อมใช้งาน</option>
                          <option value="IN_USE">กำลังใช้งาน</option>
                          <option value="BROKEN">ชำรุด</option>
                          <option value="LOST">สูญหาย</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          ที่เก็บ
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          หมายเหตุ
                        </label>
                        <input
                          type="text"
                          name="note"
                          value={formData.note}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 text-sm"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="bg-[#25B99A] text-white px-4 py-2 rounded hover:bg-teal-600 text-sm"
                        >
                          บันทึก
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}