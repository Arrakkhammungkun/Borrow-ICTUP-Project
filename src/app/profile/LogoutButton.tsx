// src/app/profile/LogoutButton.tsx
"use client"; // ต้องมี "use client" เพื่อให้ทำงานในเบราว์เซอร์

import { destroyCookie } from 'nookies'; // สำหรับลบ cookie
import { useRouter } from 'next/navigation'; // สำหรับ redirect
import React from 'react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    console.log('Logout button clicked. Destroying auth_token cookie...');
    // ลบ auth_token cookie
    destroyCookie(null, 'auth_token', { path: '/' });
    
    // Redirect ไปหน้า Login
    router.push('/Login');
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
    >
      ออกจากระบบ
    </button>
  );
}