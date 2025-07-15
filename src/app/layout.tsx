
import "./globals.css";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* ลบ className ที่เกี่ยวข้องกับ font ออก */}
      <body className="antialiased">
        <div className="min-h-screen flex">
          
          <main className="flex-1 p-4 ml-0 md:ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
