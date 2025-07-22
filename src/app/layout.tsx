"use client";
import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const mainClass = pathname === "/Login" ? "flex-1 " : "flex-1  ml-0 md:ml-64";

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex">
          <main className={mainClass}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}