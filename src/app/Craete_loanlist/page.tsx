"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck,faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
//ถ้า quantity > availableQuantity (แต่ code คุณยังไม่เช็ค, แนะนำเพิ่มใน frontend หรือ backend).
interface EquipmentItem {
  id: number;
  code: string;
  name: string;
  owner: string;
  quantity: number;
  availableQuantity:number;
  unit:string;
}

export default function Equipmentlist() {
  const router = useRouter();
  const [borrowItems, setBorrowItems] = useState<EquipmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState<EquipmentItem[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("borrowItems");
    if (saved) {
      setBorrowItems(JSON.parse(saved));
    }
    setInitialized(true);
  }, []);

  useEffect(() => {

    const fetchEquipments = async () => {

      try {
        const res = await fetch('/api/equipments', { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Failed to fetch equipments');
        }
        const data = await res.json();
      
        setEquipments(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchEquipments();
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("borrowItems", JSON.stringify(borrowItems));
    }
  }, [borrowItems, initialized]);

  const filterResults = (term: string) => {
    return equipments.filter(
      (item) =>
        item.code.includes(term) ||
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.owner.toLowerCase().includes(term.toLowerCase())
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    const results = filterResults(term);
    setFilteredResults(results);
  };

  const handleFocus = () => {
    setIsFocused(true);
    const results = filterResults(searchTerm);
    setFilteredResults(results);
  };

  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
  };

  const handleSelectItem = (item: EquipmentItem) => {
    if (borrowItems.length >= 1) {
      alert("คุณได้เลือกได้สูงสุด 1 รายการ");
      return;
    }
    if (borrowItems.find((i) => i.id === item.id)) {
      alert("รายการนี้ถูกเลือกแล้ว");
      setSearchTerm("");
      setFilteredResults([]);
      return;
    }
    const newItem = { ...item, quantity: 1 };
    setBorrowItems([...borrowItems, newItem]);
    setSearchTerm("");
    setFilteredResults([]);
  };

  const handleDelete = (id: number) => {
    setBorrowItems(borrowItems.filter((item) => item.id !== id));
  };

  // อัปเดตจำนวนเมื่อมีการเปลี่ยนแปลงใน input
  const handleQuantityChange = (id: number, value: number) => {
    const equipment =borrowItems.find((item) => item.id ===id);
    if(!equipment) return;

    let newValue = value;

    if (newValue < 1) {
      Swal.fire({
        title: "จำนวนต้องมากกว่า 0!",
        icon: "error",
        draggable: true,
      });
      return;
    }

    if(newValue > equipment.availableQuantity){
      Swal.fire({
        title: `ยืมได้สูงสุดคือ ${equipment.availableQuantity} ${equipment.unit}`,
        icon: "error",
        draggable: true,
      });
      newValue = equipment.availableQuantity;
    }
    setBorrowItems(
      borrowItems.map((item) =>
        item.id === id ? { ...item, quantity: newValue } : item
      )
    );
  };

  const handleCreateForm = () => {
    if (borrowItems.length === 0) {
      alert("กรุณาเลือกรายการก่อน");
      return;
    }

    const item = borrowItems[0]; // เพราะคุณกำหนด max 1 รายการ
    router.push(`/Craete_form/${item.id}?qty=${item.quantity}`);
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mt-16 p-2 ">
        <Sidebar  />
        <main className="flex-1 p-4 md:p-6 ml-0 text-black border rounded-md border-[#3333] bg-gray-50">
          <h1 className="text-2xl font-bold text-[#4682B4] mb-2">สร้างรายการยืม</h1>
          <hr className="mb-6 border-[#DCDCDC]" />
          <div className="flex gap-4">
         
          <div className="relative w-full max-w-3xl mb-4">
            <input
              type="text"
              className="rounded px-3 h-10 w-full border-[#87A9C4] border-2 shadow-[#87A9C4] shadow-[0_0_10px_#87A9C4]"
              placeholder="รหัส / ชื่ออุปกรณ์ / ชื่อเจ้าของ"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="off"
            />
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
              </svg>
            </div>
            {filteredResults.length > 0 && isFocused && (
              <ul className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-auto mt-1 shadow-lg">
                {filteredResults.map((item) => (
                  <li
                    key={item.id}
                    className="p-2 hover:bg-blue-200 cursor-pointer"
                    onMouseDown={() => handleSelectItem(item)}
                  >
                    {item.code} - {item.name} (เหลือจำนวน {item.availableQuantity}) ({item.owner})
                  </li>
                ))}
              </ul>
            )}
          </div>

         
          <div>
            <button
              onClick={handleFocus}
              className="bg-[#25B99A] hover:bg-[#2d967f] text-white px-3 h-10 sm:px-4 rounded flex items-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
              <span>ค้นหา</span>
            </button>
          </div>
        </div>

          

          <div className="mt-6">
            <p className="text-base md:text-lg font-medium mb-2">รายการที่ต้องการยืมทั้งหมด</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black text-xs sm:text-sm divide-y divide-black">
                <thead>
                  <tr className="bg-[#2B5279] text-white text-left divide-x divide-black">
                    <th className="p-1 sm:p-2 border border-black whitespace-nowrap">ที่</th>
                    <th className="p-1 family: 'Arial', sans-serif;">รหัส</th>
                    <th className="p-1 sm:p-2 border border-black">รายการ</th>
                    <th className="p-1 sm:p-2 border border-black whitespace-nowrap">เจ้าของ</th>
                    <th className="p-1 sm:p-2 border border-black whitespace-nowrap">จำนวน</th>
                    <th className="p-1 sm:p-2 border border-black text-center whitespace-nowrap">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {borrowItems.map((item, idx) => (
                    <tr key={item.id} className=" divide-x divide-black">
                      <td className="p-1 sm:p-2 border">{idx + 1}</td>
                      <td className="p-1 sm:p-2 border truncate max-w-[100px] sm:max-w-[150px]">{item.code}</td>
                      <td className="p-1 sm:p-2 border truncate max-w-[120px] sm:max-w-[200px]">{item.name}</td>
                      <td className="p-1 sm:p-2 border truncate max-w-[100px] sm:max-w-[150px]">{item.owner}</td>
                      <td className="p-1 sm:p-2 border text-center w-16 sm:w-20 md:w-24">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                          className="w-full p-1 border border-black rounded text-center text-xs sm:text-sm"
                          min="1"
                          max={item.availableQuantity}
                        />
                      </td>


                      <td className="p-1 sm:p-2 border text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-[#E74C3C] hover:bg-[#c0392b] text-white px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm cursor-pointer"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                  {borrowItems.length === 0 && (
                    <tr>
                      <td className="p-2 border text-center" colSpan={6}>
                        ยังไม่มีรายการที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4 sm:mt-6">
              {borrowItems.length > 0 && (
                <div className="p-1 mb-4 sm:mb-8">
                  <div className="flex justify-end">
                    <button
                      onClick={handleCreateForm}
                      className="bg-[#25B99A] hover:bg-[#2d967f] text-white px-3 py-2 sm:px-4 sm:py-2 rounded flex items-center gap-2 text-sm sm:text-base cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} size="lg" />
                      <span>สร้างฟอร์ม</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
