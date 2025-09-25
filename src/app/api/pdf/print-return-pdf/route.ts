"use server"
import { NextResponse, NextRequest } from 'next/server';
import { Buffer } from 'buffer';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { launchBrowser } from "@/lib/puppeteer";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {

let body;
  try {
    body = await req.json();
    if (!body.borrowingId) {
      return NextResponse.json({ error: 'ต้องระบุ เลขที่ใบยืม' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { borrowingId } = body;

  // Authentication
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
  if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
  const userId = user.id;

  try {
    // Fetch single borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { 
        id: parseInt(borrowingId),
        borrowerId: userId,
        status: { in: ['RETURNED', 'OVERDUE'] },
      },
      include: {
        borrower: true,
        details: { 
          include: { 
            equipment: { include: { owner: true } },
            returnHistories: true 
          } 
        },
      },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'ไม่พบรายการคืนของผู้ใช้ หรือสถานะไม่ใช่ที่คืนแล้ว' }, { status: 404 });
    }

    // Generate HTML content (same as original but for single borrowing)
    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; }     
            @font-face {
              font-family: 'THSarabun';
              src: url('/fonts/THSarabunNew-Regular.ttf') format('truetype');
              font-weight: normal;
            }
            @font-face {
              font-family: 'THSarabun';
              src: url('/fonts/THSarabunNew-Bold.ttf') format('truetype');
              font-weight: bold;
            }
            body { font-family: 'THSarabun','Noto Sans Thai', sans-serif; font-size: 16px; line-height: 1.4; }
            #h { text-align: center; font-weight: 500; margin-bottom: 5px; font-size: 18px;}
            h3 { text-align: center; margin-top: 0; font-weight: 500; font-size: 18px;}
            p { margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 14px; }
            .signature { margin-top: 20px; text-align: right; }
            .underline { border-bottom: 1px dotted #000; min-width: 150px; display: inline-block; }
            #date-p { text-align: right; }
            .name-p { padding-left: 20px; display: flex; gap: 40px; }
            .department { display: flex; gap: 40px; }
            .inline-text { white-space: nowrap; }
            .underline2 { border-bottom: 1px dotted #000; display: inline-block; padding: 0 4px; min-width: 20px; width: auto; }
            .text-justify { text-align: justify; }
            .container { display: grid; grid-template-columns: 1fr 1fr; max-width: 100%; margin: 0 auto; margin-top: 20px; font-size: 12px; }
            .box { border: 1px solid #000; padding: 10px; height: 200px; box-sizing: border-box; word-break: break-word; overflow: hidden; }
            .box:nth-child(2n) { border-left: none; }
            .margin-t { margin-top: 7px; }
            .Inspector { margin-top: 45px; }
            .margin-l-Inspector { margin-left: 10px; }
            .margin-center-Inspector { margin-left: 30px; }
            .Inspector2 { margin-top: 15px; }
            .text-box3 { font-weight: bold; font-size: 12px; }
            .flex-box { display: flex; align-items: center; text-align: center; gap: 54px; }
            .flex-box2 { display: flex; justify-content: space-between; align-items: center; }
            .flex-box2 label { white-space: nowrap; flex: 0 0 auto; }
            .page-break { page-break-after: always; }
            .attachment-note { color: red; font-size: 12px; margin-top: 10px; }
            .flexEnd{
              display: flex;
              justify-content: space-between;
              margin-top: 80px;
            }
          </style>
        </head>
        <body>
    `;

    // Calculate variables for single borrowing
    const currentDate = new Date().toLocaleDateString('th-TH');
    const Name =
      `${borrowing?.borrower_firstname || ''} ${borrowing?.borrower_lastname || ''}`.trim() ||
      `${borrowing?.borrower?.first_name || ''} ${borrowing?.borrower?.last_name || ''}`.trim() ||
      'ไม่ระบุ';
    const jobTitle = borrowing.borrower_position || 'ไม่ระบุ';
    const department = borrowing.details[0]?.department || 'ไม่ระบุ';
    const phone = borrowing.borrower.mobilePhone || 'ไม่ระบุ';
    const startDate = borrowing.requestedStartDate ? new Date(borrowing.requestedStartDate).toLocaleDateString('th-TH') : '';
    const borrowDate = borrowing.borrowedDate ? new Date(borrowing.borrowedDate).toLocaleDateString('th-TH') : '';
    const dueDate = borrowing.dueDate ? new Date(borrowing.dueDate).toLocaleDateString('th-TH') : '';
    const noteData = borrowing.details.length > 0 ? borrowing.details[0].note || 'ไม่ระบุ' : 'ไม่ระบุ';
    const location = borrowing.location || "ไม่ระบุ";
    const NameOwner = borrowing.details[0]?.equipment?.owner?.displayName || 'ไม่ระบุ';
    let days = '';
    if (borrowing.requestedStartDate && borrowing.borrowedDate) {
      const diffTime = Math.abs(
        new Date(borrowing.borrowedDate).getTime() - new Date(borrowing.requestedStartDate).getTime()
      );
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
    }


    // Generate HTML for the main form
    htmlContent += `
          <h3 id="h">แบบฟอร์มรับคืนพัสดุ / ครุภัณฑ์</h3>
          <h3>มหาวิทยาลัยพะเยา</h3>
          <p id="date-p">วันที่ ${currentDate}</p>
          <p>เรียน อธิการบดี</p>
          <div class="name-p">
            <span>ข้าพเจ้า (นาย/นาง/นางสาว) <span class="inline-text">${Name}</span></span>
            <span>ตำแหน่ง <span class="inline-text">${jobTitle}</span></span>
          </div>
          <p class="department">
            คณะ/กอง/ศูนย์ <span>${department}</span>
            เบอร์โทรศัพท์ <span>${phone}</span>
          </p>
          <p>มีความประสงค์ขอยืมพัสดุ / ครุภัณฑ์ ตามรายการดังต่อไปนี้</p>
    `;

    // Generate table for page 1 (max 5 rows)
    const details = borrowing.details;
    const maxRowsPage1 = 1;
    htmlContent += `
          <table>
            <thead>
              <tr>
                <th>ลำดับที่</th>
                <th>รายการ</th>
                <th>จำนวน</th>
                <th>หน่วย</th>
                <th>หมายเลขพัสดุ / ครุภัณฑ์</th>
              </tr>
            </thead>
            <tbody>
    `;
    let rowsPage1 = details.slice(0, maxRowsPage1).map((detail, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${detail.equipment.name || 'ไม่ระบุ'}</td>
            <td>${detail.quantityBorrowed}</td>
            <td>${detail.equipment.unit || 'ไม่ระบุ'}</td>
            <td>${detail.equipment.serialNumber || 'ไม่ระบุ'}</td>
          </tr>
    `).join('');

    for (let i = details.slice(0, maxRowsPage1).length; i < maxRowsPage1; i++) {
      rowsPage1 += `<tr><td></td><td></td><td></td><td></td><td></td></tr>`;
    }

    htmlContent += rowsPage1 + `</tbody></table>`;

    // Additional form content
    htmlContent += `
          <p>เพื่อใช้ในงาน <span>${noteData}</span></p>
          <p>สถานที่นำไปใช้ <span>${location}</span></p>
          <p class="inline-text">
            ระหว่างวันที่ <span>${startDate}</span> 
            ถึงวันที่ <span>${borrowDate}</span> 
            รวมเป็นเวลา <span>${days}</span> วัน
          </p>
          <p class="text-justify">ข้าพเจ้าจะนำส่งคืนวันที่ ${dueDate} หากพัสดุ / ครุภัณฑ์ที่นำมาส่งคืนชำรุดเสียหายหรือใช้การไม่ได้ 
            หรือสูญหายไป ข้าพเจ้ายินดีจัดการแก้ไขซ่อมแซมให้คงสภาพเดิม โดยเสียค่าใช้จ่ายของตนเอง หรือ
            ชดใช้เป็นพัสดุ / ครุภัณฑ์ ประเภท ชนิด ขนาด ลักษณะและคุณภาพอย่างเดียวกัน หรือชดใช้เป็นเงิน
            ตามราคาที่เป็นอยู่ในขณะยืม ตามหลักเกณฑ์ที่กระทรวงการคลังกําหนด
          </p>
          <div class="flexEnd ">
              <div class="signature">
              ลงชื่อ ${Name} ผู้ยืม
            </div>
            <div class="signature">
              ลงชื่อ ${NameOwner} ผู้ให้ยืม
            </div>
          </div>

    `;

    // Add attachment page if details > maxRowsPage1
    if (details.length > maxRowsPage1) {
      htmlContent += `<div class="page-break"></div>`;
      htmlContent += `
            <h3 style="font-size: 14px;">เอกสารแนบ แบบฟอร์มขอยืมพัสดุ / ครุภัณฑ์ มหาวิทยาลัยพะเยา</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">ลำดับที่</th>
                  <th style="width: 48%;">รายการ</th>
                  <th style="width: 10%;">จำนวน</th>
                  <th style="width: 10%;">หน่วย</th>
                  <th style="width: 24%;">หมายเลขพัสดุ / ครุภัณฑ์</th>
                </tr>
              </thead>
              <tbody>
      `;
      let remainingRows = details.slice(maxRowsPage1).map((detail, i) => `
            <tr>
              <td>${maxRowsPage1 + i + 1}</td>
              <td>${detail.equipment.name || 'ไม่ระบุ'}</td>
              <td>${detail.quantityBorrowed}</td>
              <td>${detail.equipment.unit || 'ไม่ระบุ'}</td>
              <td>${detail.equipment.serialNumber || 'ไม่ระบุ'}</td>
            </tr>
      `).join('');

      const maxRowsPage2 = 30;
      for (let i = details.length - maxRowsPage1; i < maxRowsPage2; i++) {
        remainingRows += `<tr><td></td><td></td><td></td><td></td><td></td></tr>`;
      }

      htmlContent += remainingRows + `</tbody></table>`;
      htmlContent += `
            <div class="attachment-note">
              หมายเหตุ -ในกรณีที่ยืมพัสดุหลายรายการ ให้จัดทําเป็นเอกสารแนบ<br />
              -การยืมพัสดุหนึ่งครั้ง สามารถยืมได้ 7-15 วัน นับถัดจากวันที่ได้รับพัสดุที่ขอยืม<br />
              -กรุณาแจ้งการยืมล่วงหน้า 7 วัน ก่อนวันที่จะยืม
            </div>
      `;
    }

    htmlContent += `</body></html>`;

    // Generate PDF
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    });
    const buffer = Buffer.from(pdfBuffer);
    await browser.close();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=borrowing_${borrowingId}.pdf`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}