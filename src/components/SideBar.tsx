"use client";
import React, { JSX, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { msalInstance } from "@/lib/msal"; 
import Swal from "sweetalert2";
import { useUser } from "@/contexts/UserContext";

interface MenuItem {
  href: string;
  icon: JSX.Element;
  label: string;
  badge?: number; 
}
const HistoryIcon = () => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 group-hover:text-white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 group-hover:text-white"
  >
    <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M3 15h6" />
    <path d="M6 12v6" />
  </svg>
);

const DocumentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 group-hover:text-white"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

const WaitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 group-hover:text-white"
  >
    <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
    <path d="M8 14v2.2l1.6 1" />
    <circle cx="8" cy="16" r="6" />
  </svg>
);

const EquipmentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 group-hover:text-white"
  >
    <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />
    <path d="M20.054 15.987H3.946" />
  </svg>
);

// const SettingsIcon = () => (
//   <svg
//     className="w-5 h-5 text-gray-400 group-hover:text-white"
//     fill="currentColor"
//     viewBox="0 0 20 20"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path
//       fillRule="evenodd"
//       d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
//       clipRule="evenodd"
//     ></path>
//   </svg>
// );

const ReturnIcon = () => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400 group-hover:text-white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400 group-hover:text-white"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const menuItems: MenuItem[] = [
  { href: "/Craete_loanlist", icon: <DashboardIcon />, label: "สร้างคำขอยืม" },
  { href: "/LoanList", icon: <DocumentIcon />, label: "รายการยืมปัจจุบัน" },
  { href: "/BorrowHistory", icon: <HistoryIcon />, label: "ประวัตการยืม" },
  { href: "/Approval", icon: <WaitIcon />, label: "รออนุมัติขอยืม" },
  { href: "/Equipmentlist", icon: <EquipmentIcon />, label: "รายการอุปกรณ์" },
  { href: "/Return", icon: <ReturnIcon />, label: "รับคืน" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const { setUser } = useUser();

  // useEffect(() => {
  //   fetchPending();
  //   console.log("sidebar work")
  //   // ✅ auto refresh ทุก 30 วิ
  //   const interval = setInterval(fetchPending, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  // const fetchPending = async () => {
  //   try {
  //     const res = await fetch("/api/borrowings?type=owner&status=PENDING", {
  //       method: "GET",
  //       credentials: "include",
  //     });
  //     if (res.ok) {
  //       const data = await res.json();
  //       setPendingCount(data.length); // นับจำนวนรายการ PENDING
  //     }
  //   } catch (err) {
  //     console.error("Fetch pending error:", err);
  //   }
  // };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการออกจากระบบหรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        setUser(null);
        localStorage.removeItem("user");
        console.log("LocalStorage user:", localStorage.getItem("user"));
        await msalInstance.initialize();

        await msalInstance.logoutRedirect();

        router.push("/Login");
        Swal.fire("ออกจากระบบแล้ว", "", "success");
      } catch (error) {
        console.error("Logout failed:", error);
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถออกจากระบบได้", "error");
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire("ยกเลิกแล้ว", "ยังคงอยู่ในระบบ", "info");
    }
  };

  return (
    <>
      {/* ปุ่ม Hamburger (แสดงเฉพาะบนมือถือ) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#2A3B4C] text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800 text-white 
          transition-transform transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 z-50
        `}
      >
        <div className="p-5">
          <h2 className="text-2xl font-semibold text-white">BorrowMe ICT</h2>
        </div>
        <nav className="mt-5">
          <ul>
            {menuItems.map((item) => (
              <li key={item.label} className="px-3">
                <Link
                  href={item.href}
                  className="flex items-center p-2 my-1 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white group"
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>

                  {/* ถ้าเป็นเมนู Approval ให้ใช้ pendingCount */}
                  {item.label === "รออนุมัติขอยืม" && pendingCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {pendingCount}
                    </span>
                  )}

                  {/* ถ้าเมนูอื่นมี badge */}
                  {item.badge && item.label !== "รออนุมัติขอยืม" && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}

            {/* ปุ่ม Logout */}
            <li className="px-3">
              <button
                onClick={handleLogout}
                className="flex items-center p-2 my-1 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white group w-full text-left"
              >
                <LogoutIcon />
                <span className="ml-3">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay สำหรับมือถือเมื่อ Sidebar เปิด */}
      {isOpen && (
        <div
          className="fixed inset-0    z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
