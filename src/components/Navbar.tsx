"use client"

import React, { useState, useRef, useEffect } from "react";
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import FullScreenLoader from "./FullScreenLoader";
import Swal from "sweetalert2";
import { msalInstance } from "@/lib/msal";

export default function Navbar() {
  const { user, loading } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setUser } = useUser();

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
  
  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };


  return (
    <>
      {/* Navbar แสดงตลอด */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#5F9EA0] text-white h-16 flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="ml-0 md:ml-64">
            {/* logo หรืออะไรเพิ่มเติม */}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 hover:bg-[#4A8B8D] px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.first_name
                    ? user.first_name.charAt(0).toUpperCase()
                    : user?.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : "?"}
                </span>
              </div>

              
              {/* Username */}
              <span className="text-base hidden sm:block">
                {user ? user?.displayName : "Loading..."}
              </span>
              
              {/* Dropdown Arrow */}
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.displayName || "ผู้ใช้"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || ""}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>ข้อมูลส่วนตัว</span>
                  </button>

                  {/* <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/settings');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>ตั้งค่า</span>
                  </button> */}

                  <hr className="my-1 border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Loader ทับหน้าทั้งหมด */}
      {loading && <FullScreenLoader />}
    </>
  );
}