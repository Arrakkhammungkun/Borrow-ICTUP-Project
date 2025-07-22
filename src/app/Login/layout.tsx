import ".././globals.css";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex items-center justify-center bg-[#f3f5fb]">
        {children}
      </body>
    </html>
  );
}