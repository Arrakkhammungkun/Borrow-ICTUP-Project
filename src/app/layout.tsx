"use client"; // ระบุว่าเป็น Client Component

import { usePathname } from "next/navigation";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // กำหนด layout class ตาม path
  let mainClass = "flex-1 min-h-screen";
  if (pathname === "/Login") {
    mainClass =
      "flex justify-center min-h-screen bg-cover bg-center bg-[url('/bg.jpg')] w-full p-40";
  }
  if (pathname === "/create-profile") {
    mainClass =
      "flex justify-center min-h-screen bg-cover bg-right bg-[url('/ictbg.png')] w-full";
  } else if (pathname === "/callback/azure") {
    mainClass += " flex  justify-center bg-[#f3f5fb]";
  } else {
    mainClass += " ml-0 md:ml-64";
  }

  return (
    <html lang="en">
      <body className="antialiased min-h-screen relative">
        <UserProvider>
          <div className="min-h-screen flex relative">
            <main className={mainClass}>{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
