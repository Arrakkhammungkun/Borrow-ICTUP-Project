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
    "justify-center  min-h-screen bg-cover bg-center bg-no-repeat w-full bg-cover bg-center bg-[url('/bg.jpg')]";
} else if (pathname === "/create-profile") {
  mainClass =
    "flex justify-center min-h-screen bg-cover bg-right bg-[url('/ictbg.png')] w-full";
} else if (pathname === "/callback/azure") {
  mainClass = "flex  justify-center bg-center bg-no-repeat w-full bg-cover bg-center bg-[url('/bg.jpg')]";
} else {
  // หน้าอื่นๆ มี sidebar
  mainClass = "flex-1 min-h-screen ml-0 md:ml-64";
}


  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com"  />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700&display=swap"
          rel="stylesheet"
        />

      </head>
      <body className="antialiased min-h-screen relative ">
        <UserProvider>
          <div className="min-h-screen flex relative">
            <main className={mainClass}>{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
