import ".././globals.css";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-[680px] h-[440px] bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 flex">
      {children}
    </div>
  );
}