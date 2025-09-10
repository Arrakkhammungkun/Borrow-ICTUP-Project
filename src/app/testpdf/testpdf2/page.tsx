'use client';
import React, { useState } from 'react';

export default function PDFPreview2() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePreview = async () => {
    try {
      const res = await fetch('/api/pdf/generate-pdf');
      if (!res.ok) throw new Error('เกิดข้อผิดพลาด');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถโหลด PDF ได้');
    }
  };
  const handleDownload = async () => {
    try {
      const res = await fetch('/api/pdf/generate-pdf');
      if (!res.ok) throw new Error('เกิดข้อผิดพลาด');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // สร้างลิงก์ดาวน์โหลดชั่วคราว
      const link = document.createElement('a');
      link.href = url;
      link.download = 'แบบฟอร์มขอยืมพัสดุครุภัณฑ์.pdf'; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // cleanup
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถดาวน์โหลด PDF ได้');
    }
  };

    return (
    <div className="w-screen h-screen">
            <button
        className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
        onClick={handleDownload}
      >
        ดาวน์โหลด PDF
      </button>
      {!pdfUrl && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded absolute top-4 left-4 z-10"
          onClick={handlePreview}
        >
          Preview PDF
        </button>
      )}
     
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            border: 'none',
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
}