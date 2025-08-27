"use server"
import { NextResponse, NextRequest } from 'next/server';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import path from 'path';
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Verify token จาก cookie
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret') as { up_id: string };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const userUpId = decoded.up_id;

  const user = await prisma.user.findUnique({ where: { up_id: userUpId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const userId = user.id;

  try {
    // Fetch APPROVED borrowings ของ user
    const borrowings = await prisma.borrowing.findMany({
      where: { borrowerId: userId, status: 'APPROVED' },
      include: {
        borrower: true,  // สำหรับชื่อผู้ยืม
        details: { include: { equipment: true } },  // สำหรับ table รายการ
      },
      orderBy: { createdAt: 'desc' },
    });

    if (borrowings.length === 0) {
      return NextResponse.json({ error: 'No approved borrowings found' }, { status: 404 });
    }

    // ✅ Monkey patch เพื่อป้องกันการโหลด font มาตรฐาน Helvetica ใน constructor
    const originalFont = PDFDocument.prototype.font;
    PDFDocument.prototype.font = function () { return this; }; // No-op ชั่วคราว

    // ✅ Generate PDF server-side
    const doc = new PDFDocument({ size: 'A4',
    margins: {
        top: 50,          // ระยะขอบบน (pt) ประมาณ 3.5 cm
        bottom: 50,        // ระยะขอบล่าง
        left: 70,          // ระยะขอบซ้าย
        right: 70,         // ระยะขอบขวา
    } });

    // Restore method font เดิม
    PDFDocument.prototype.font = originalFont;

    // Register Thai font (ปรับ path ให้ตรงกับโฟลเดอร์ของคุณ)
    const regularFontPath = path.join(process.cwd(), 'public/fonts/THSarabunNew-Regular.ttf');
    const boldFontPath = path.join(process.cwd(), 'public/fonts/THSarabunNew-Bold.ttf');
    doc.registerFont('THSarabun-Regular', regularFontPath);
    doc.registerFont('THSarabun-Bold', boldFontPath);

    // Set default font เป็น Thai
    doc.font('THSarabun-Regular').fontSize(14);

    // Stream PDF to buffer
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Loop แต่ละ borrowing เพื่อสร้าง form (add page ถ้ามากกว่า 1 borrowing)
    borrowings.forEach((borrowing, borrowingIndex) => {
      if (borrowingIndex > 0) doc.addPage();

      // ======= เริ่มเขียนฟอร์มให้เหมือนเป๊ะยิ่งขึ้น =======
      
      doc.font('THSarabun-Bold').fontSize(18).text('แบบฟอร์มขอยืมพัสดุ / ครุภัณฑ์', { align: 'center' });
      doc.moveDown(1);
      doc.font('THSarabun-Bold').fontSize(18).text('มหาวิทยาลัยพะเยา', { align: 'center' });

      // Simulate blank lines with moveDown (ปรับให้มีช่องว่างมากขึ้นเหมือน form)
        doc.moveDown(1);
      // วันที่ line: ใช้ absolute position เพื่อให้ dots อยู่ตรงกลาง, date ทางขวา
      let y = doc.y;
        const currentDate = new Date().toLocaleDateString('th-TH'); 
        const pageWidth = doc.page.width;
        const marginLeft = doc.page.margins.left;
        const marginRight = doc.page.margins.right;

        doc.font('THSarabun-Regular').fontSize(14).text(`วันที่ ${currentDate}`, {
        width: pageWidth - marginLeft - marginRight,
        align: 'right',
        });


      doc.moveDown(1.5);

      // เรียน อธิการบดี
      doc.font('THSarabun-Regular').fontSize(16).text('เรียน อธิการบดี');
        // ข้อมูลผู้ยืม: ใช้ continued สำหรับ insert value แต่ปรับ spacing
        const Name = borrowing.borrower.displayName || `${borrowing.borrower.prefix || ''}${borrowing.borrower.first_name || ''} ${borrowing.borrower.last_name || ''}`.trim() || 'ไม่ระบุ';
        const jobTitle = borrowing.borrower.jobTitle || 'ไม่ระบุ';
        const line = `ข้าพเจ้า (นาย/นาง/นางสาว) ${Name} ตำแหน่ง ${jobTitle} `;
        doc.text(line,{
            indent:20,
            lineGap: 4, 
        });


      y = doc.y;
      const department = borrowing.borrower.officeLocation || 'ไม่ระบุ';
      const phone = borrowing.borrower.mobilePhone || 'ไม่ระบุ';
      
      doc.text('คณะ/กอง/ศูนย์', 50, y, { continued: true });
      doc.text(' ..................................................................... ', { continued: true });
      doc.text('เบอร์โทรศัพท์', { continued: true });
      doc.text(' ......................................... ', { continued: true });
      doc.text(department, { continued: true });
      doc.text(' เบอร์โทรศัพท์ ' + phone);

      doc.moveDown(1.5);

      // ความประสงค์
      doc.text('มีความประสงค์ขอยืมพัสดุ / ครุภัณฑ์ ตามรายการดังต่อไปนี้');

      doc.moveDown(0.5);

      // ==== ตารางครุภัณฑ์: fixed rows on page 1, adjust col widths ให้ใกล้ image =====
      const tableTop = doc.y;
      const colWidths = [40, 240, 50, 50, 115]; // รวม ~495 pt (A4 width - margins)
      const headers = ['ลําดับที่', 'รายการ', 'จํานวน', 'หน่วย', 'หมายเลขพัสดุ / ครุภัณฑ์'];

      // Draw header borders and text (center)
      headers.forEach((h, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, tableTop, colWidths[i], 20).stroke();
        doc.text(h, x, tableTop + 3, { width: colWidths[i], align: 'center' });
      });

      // Data rows จาก db
      const details = borrowing.details;
      const maxRowsPage1 = 5; // ปรับให้ใกล้ form (space สำหรับ ~5 items บน page 1)
      let rows = details.slice(0, maxRowsPage1).map((detail, index) => [
        (index + 1).toString(),
        detail.equipment.name || 'ไม่ระบุ',
        detail.quantityBorrowed.toString(),
        detail.equipment.unit || 'ไม่ระบุ',
        detail.equipment.serialNumber || 'ไม่ระบุ'
      ]);

      // เติม blank rows ให้ครบ maxRowsPage1
      while (rows.length < maxRowsPage1) {
        rows.push(['', '', '', '', '']);
      }

      // Draw rows page 1
      rows.forEach((row, rowIndex) => {
        const rowY = tableTop + 20 + rowIndex * 20;
        row.forEach((cell, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.rect(x, rowY, colWidths[i], 20).stroke();
          doc.text(cell, x + 5, rowY + 3, { width: colWidths[i] - 10, align: 'left' });
        });
      });

      let currentY = tableTop + 20 + maxRowsPage1 * 20 + 10; // ช่องว่างหลัง table

      // ถ้ามี items มากกว่า maxRowsPage1, สร้าง page 2 สำหรับ attachment
      if (details.length > maxRowsPage1) {
        doc.addPage();
        doc.font('THSarabun-Bold').fontSize(14).text('เอกสารแนบ แบบฟอร์มขอยืมพัสดุ / ครุภัณฑ์ มหาวิทยาลัยพะเยา', 50, 50, { align: 'left' });

        const attachTableTop = 70;
        // Header เดียวกัน
        headers.forEach((h, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.rect(x, attachTableTop, colWidths[i], 20).stroke();
          doc.text(h, x, attachTableTop + 3, { width: colWidths[i], align: 'center' });
        });

        // Remaining data rows
        const remainingDetails = details.slice(maxRowsPage1);
        let remainingRows = remainingDetails.map((detail, index) => [
          (maxRowsPage1 + index + 1).toString(),
          detail.equipment.name || 'ไม่ระบุ',
          detail.quantityBorrowed.toString(),
          detail.equipment.unit || 'ไม่ระบุ',
          detail.equipment.serialNumber || 'ไม่ระบุ'
        ]);

        const maxRowsPage2 = 30; // ประมาณจาก form
        while (remainingRows.length < maxRowsPage2) {
          remainingRows.push(['', '', '', '', '']);
        }

        remainingRows.forEach((row, rowIndex) => {
          const rowY = attachTableTop + 20 + rowIndex * 20;
          row.forEach((cell, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, rowY, colWidths[i], 20).stroke();
            doc.text(cell, x + 5, rowY + 3, { width: colWidths[i] - 10, align: 'left' });
          });
        });

        // หมายเหตุที่ท้าย page 2 ในสีแดง
        const noteY = attachTableTop + 20 + maxRowsPage2 * 20 + 10;
        doc.fontSize(12).fillColor('red');
        doc.text('หมายเหตุ -ในกรณีที่ยืมพัสดุหลายรายการ ให้จัดทําเป็นเอกสารแนบ', 50, noteY);
        doc.moveDown(0.5);
        doc.text('-การยืมพัสดุหนึ่งครั้ง สามารถยืมได้ 7-15 วัน นับถัดจากวันที่ได้รับพัสดุที่ขอยืม');
        doc.moveDown(0.5);
        doc.text('-กรุณาแจ้งการยืมล่วงหน้า 7 วัน ก่อนวันที่จะยืมพัสดุ');

        // กลับไป page 1
        doc.switchToPage(borrowingIndex);
        doc.fillColor('black');
        doc.fontSize(14);
      }

      doc.y = currentY;

      // เพื่อใช้ในงาน (blank line)
      doc.text('เพื่อใช้ในงาน ........................................................................................................................................');

      doc.moveDown(0.5);

      // สถานที่นำไปใช้ (blank)
      doc.text('สถานที่นําไปใช้ …………………………..……………………………………………………………………………………………................');

      doc.moveDown(0.5);

      // ระหว่างวันที่: insert values
      const startDate = borrowing.requestedStartDate ? new Date(borrowing.requestedStartDate).toLocaleDateString('th-TH') : '';
      const dueDate = borrowing.dueDate ? new Date(borrowing.dueDate).toLocaleDateString('th-TH') : '';
      let days = '';
      if (borrowing.requestedStartDate && borrowing.dueDate) {
        const diffTime = Math.abs(new Date(borrowing.dueDate).getTime() - new Date(borrowing.requestedStartDate).getTime());
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
      }
      y = doc.y;
      doc.text('ระหว่างวันที่', 50, y, { continued: true });
      doc.text(' ………………….................................. ', { continued: true });
      doc.text('ถึงวันที่', { continued: true });
      doc.text(' ...................................... ', { continued: true });
      doc.text('รวมเป็นเวลา', { continued: true });
      doc.text(' ............ ', { continued: true });
      doc.text('วัน ' + (startDate ? ' ' + startDate + ' ' : '') + (dueDate ? 'ถึงวันที่ ' + dueDate + ' ' : '') + (days ? 'รวมเป็นเวลา ' + days + ' วัน' : ''));

      doc.moveDown(0.5);

      // ข้าพเจ้าจะนำส่งคืน paragraph: ใช้ multi-line text
      y = doc.y;
      doc.text('ข้าพเจ้าจะนําส่งคืนวันที่ ', 50, y, { continued: true });
      doc.text(' ..................... ', { continued: true });
      doc.text('หากพัสดุ / ครุภัณฑ์ ที่นํามาส่งคืนชํารุดเสียหายหรือใช้การไม่ได้ ', { continued: true });
      doc.text(dueDate ? dueDate + ' ' : '');
      const paragraph = 'หรือสูญหายไป ข้าพเจ้ายินดีจัดการแก้ไขซ่อมแซมให้คงสภาพเดิม โดยเสียค่าใช้จ่ายของตนเอง หรือชดใช้เป็นพัสดุ / ครุภัณฑ์ ประเภท ชนิด ขนาด ลักษณะและคุณภาพอย่างเดียวกัน หรือชดใช้เป็นเงินตามราคาที่เป็นอยู่ในขณะยืม ตามหลักเกณฑ์ที่กระทรวงการคลังกําหนด';
      doc.text(paragraph, 50, doc.y, { width: 495 });

      doc.moveDown(1.5);

      // ลงชื่อผู้ยืม right aligned with indentation
      doc.text('ลงชื่อ ....................................... ผู้ยืม', 300, doc.y, { align: 'left', width: 245 });

      doc.moveDown(3);

      // เรียน อธิการบดี again
      doc.text('เรียน อธิการบดี', 50, doc.y);

      doc.moveDown(0.5);

      doc.text('ตรวจสอบแล้วสามารถจ่ายพัสดุ ครุภัณฑ์ตามรายการได้');

      doc.moveDown(1.5);

      // ลงชื่อผู้ตรวจสอบ right
      doc.text('     ลงชื่อ .................................................. ผู้ตรวจสอบ', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('           ( ................................................... )', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('     วันที่ ......... / ............................. / ............. ', 300, doc.y, { align: 'left', width: 245 });

      doc.moveDown(1);

      // Checkbox อนุมัติ: use unicode □
      doc.text('□ อนุมัติให้ยืมพัสดุ / ครุภัณฑ์', 50, doc.y);
      doc.moveDown(0.5);
      doc.text('□ ไม่อนุมัติ เนื่องจาก ……………………………………………….………………', 50, doc.y);
      doc.text('…………………………………………………………………………..………………………', 50, doc.y + 15);

      doc.moveDown(1);

      // ลงชื่ออธิการบดี right
      doc.text('ลงชื่อ ............................................... อธิการบดี', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('   ( .................................................. )', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text(' วันที่ ............... / ................... / ............. ', 300, doc.y, { align: 'left', width: 245 });

      // Check if need new page for remaining, but adjust moveDown
      if (doc.y > 700) doc.addPage();

      doc.moveDown(1.5);

      // ได้รับพัสดุ
      doc.text('ได้รับพัสดุตามรายการข้างต้นแล้ว');

      doc.moveDown(1.5);

      doc.text('     ลงชื่อ ................................................................ ผู้ยืม', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('           ( .................................................................. )', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('     วันที่ ......... / ............................. / ............. ', 300, doc.y, { align: 'left', width: 245 });

      doc.moveDown(1.5);

      // การรับพัสดุคืน
      doc.text('การรับพัสดุ / ครุภัณฑ์คืน');

      doc.moveDown(0.5);

      // Checkboxes for condition: two lines
      doc.text('□ สภาพสมบูรณ์              □   สภาพไม่สมบูรณ์', 50, doc.y);
      doc.moveDown(0.5);
      doc.text('□ ครบถ้วนตามรายการ      □  ไม่ครบ ขาด .............. รายการ', 50, doc.y);

      doc.moveDown(1.5);

      doc.text('     ลงชื่อ .................................................. ผู้ตรวจสอบ', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('           ( ................................................... )', 300, doc.y, { align: 'left', width: 245 });
      doc.moveDown(0.5);
      doc.text('     วันที่ ......... / ............................. / ............. ', 300, doc.y, { align: 'left', width: 245 });

      // ======= จบฟอร์ม =======
    });

    doc.end();

    // Wait for buffer
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // Return PDF stream
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=approved_borrowings.pdf', // เปลี่ยนจาก attachment
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}