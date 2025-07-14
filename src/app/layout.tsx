

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* ลบ className ที่เกี่ยวข้องกับ font ออก */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
