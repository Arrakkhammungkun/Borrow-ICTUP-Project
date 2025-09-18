'use client';
import React, { useState } from 'react';
import FullScreenLoader from '@/components/FullScreenLoader';
export default function PDFPreview() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePreview = async () => {
    try {
      const res = await fetch('/api/pdf/testpdf');
      if (!res.ok) throw new Error('เกิดข้อผิดพลาด');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถโหลด PDF ได้');
    }
  };
  const sentEmail = async()=>{
        const res = await fetch('/api/send-email',{
          method:'POST'
        })
        const result = await res.json();
        console.log(result);
        alert(result.success ? 'ส่งอีเมลสำเร็จ' : 'ส่งอีเมลล้มเหลว');

  }
    return (

    <div className="w-screen h-screen">
      <FullScreenLoader />
      <button className='bg-amber-500 py-4 px-2' onClick={sentEmail}>ส่งอีมล</button>
      {!pdfUrl && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded absolute top-4 left-4 z-10"
          onClick={handlePreview}
        >
          Preview PDF
        </button>
      )}
      
      <img src="/bg.jpg" alt="" />
      
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