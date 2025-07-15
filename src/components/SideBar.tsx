// components/Sidebar.js
"use client";
import React, { useState } from "react";
import Link from "next/link"; // ใช้ Next.js Link

// ไอคอน (เหมือนในโค้ดเดิมของคุณ)
const DashboardIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400 group-hover:text-white"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
  </svg>
);
const UsersIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400 group-hover:text-white"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const SettingsIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400 group-hover:text-white"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    ></path>
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

const menuItems = [
  { href: "/admin/dashboard", icon: <DashboardIcon />, label: "สร้างคำขอยืม" },
  { href: "/admin/users", icon: <UsersIcon />, label: "รายการยืมปัจจุบัน" },
  { href: "/admin/settings", icon: <SettingsIcon />, label: "รออนุมัติขอยืม" },
  { href: "/admin/settings", icon: <SettingsIcon />, label: "รายการอุปกรณ์" },
  { href: "/admin/settings", icon: <SettingsIcon />, label: "รับคืน" },
  { href: "/logout", icon: <LogoutIcon />, label: "Logout" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

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
          md:translate-x-0
        `}
      >
        <div className="p-5">
          <h2 className="text-2xl font-semibold text-white">Admin Panel</h2>
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
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Overlay สำหรับมือถือเมื่อ Sidebar เปิด */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;