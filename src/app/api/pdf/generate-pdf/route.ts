"use server"
import { NextResponse, NextRequest } from 'next/server';
import { Buffer } from 'buffer';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { launchBrowser } from "@/lib/puppeteer";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const borrowingId = searchParams.get('borrowingId');
  if (!borrowingId) {
    return NextResponse.json({ error: 'ต้องระบุ เลขที่ใบยืม' }, { status: 400 });
  }

  try {
    // Fetch single borrowing with EquipmentInstance
    const borrowing = await prisma.borrowing.findUnique({
      where: { 
        id: parseInt(borrowingId),
        borrowerId: userId,
        status: { in: ['APPROVED', 'BORROWED'] },
      },
      include: {
        borrower: true,
        details: { 
          include: { 
            equipment: true,
            equipmentInstance: true // เพิ่มการดึง EquipmentInstance
          } 
        },
      },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'ไม่พบการยืมที่ได้รับการอนุมัติหรือไม่ใช่การยืมของผู้ใช้' }, { status: 404 });
    }

    // HTML content (ส่วน CSS คงเดิม)
    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link
              href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
              rel="stylesheet"
            >
          <style>
            @page { size: A4; }     

            body { font-family: 'Sarabun', sans-serif; font-size: 16px; line-height: 1.4; }
            #h { text-align: center; font-weight: 500; margin-bottom: 5px; font-size: 18px;}
            h3 { text-align: center; margin-top: 0; font-weight: 500; font-size: 18px;}
            p { margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
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
            .flex-box2 { display: flex; justify-content: space-between; align-items: center;  }
            .flex-box2 label { white-space: nowrap; flex: 0 0 auto; }
            .page-break { page-break-after: always; }
            .attachment-note { color: red; font-size: 12px; margin-top: 10px; }
            th, td {
              border: 0.5px solid #666;
              padding: 6px;
              text-align: center;
              font-size: 14px;
              height: 30px;
              display: table-cell;
              box-sizing: border-box;
              vertical-align: top;
              text-align: left;
              font-weight: normal; 
              
            }
            // .margit-l {
            //   position: relative;
            //   left: -10px
            // }
          </style>
        </head>
        <body>
    `;

    // คำนวณตัวแปรต่างๆ (เหมือนเดิม)
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
    let days = '';
    if (borrowing.requestedStartDate && borrowing.borrowedDate) {
      const diffTime = Math.abs(
        new Date(borrowing.borrowedDate).getTime() - new Date(borrowing.requestedStartDate).getTime()
      );
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
    }

    // HTML สำหรับแบบฟอร์มหลัก (เหมือนเดิม)
    htmlContent += `
          <h3 id="h">แบบฟอร์มขอยืมพัสดุ / ครุภัณฑ์</h3>
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

    // ตารางหน้าแรก (แสดง 2 รายการ)
    const details = borrowing.details;
    const maxRowsPage1 = 1; // เปลี่ยนจาก 1 เป็น 2
    htmlContent += `
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">ลำดับที่</th>
                <th style="width: 38%;">รายการ</th>
                <th style="width: 10%;">จำนวน</th>
                <th style="width: 10%;">หน่วย</th>
                <th style="width: 34%;">รหัสครุภัณฑ์</th>
              </tr>
            </thead>
            <tbody>
    `;
      let rowsPage1 = details.slice(0, maxRowsPage1).map((detail, i) => {
        const serialNumber = detail.equipmentInstance?.serialNumber || 'ไม่ระบุ'; // ใช้ serialNumber เดี่ยว
        return `
            <tr>
              <td>${i + 1}</td>
              <td>${detail.equipment.name || 'ไม่ระบุ'}</td>
              <td>${detail.quantityBorrowed}</td>
              <td>${detail.equipment.unit || 'ไม่ระบุ'}</td>
              <td>${serialNumber}</td>
            </tr>
        `;
      }).join('');

    // เติมแถวว่างถ้ามีน้อยกว่า 2 รายการ
    for (let i = details.slice(0, maxRowsPage1).length; i < maxRowsPage1; i++) {
      rowsPage1 += `<tr><td></td><td></td><td></td><td></td><td></td></tr>`;
    }

    htmlContent += rowsPage1 + `</tbody></table>`;

    // ส่วนที่เหลือของหน้าแรก (เหมือนเดิม)
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
          <div class="signature">
            ลงชื่อ ${Name} ผู้ยืม
          </div>
          <div class="container">
            <div class="box">
              <div>เรียน อธิการบดี</div>
              <div class="margin-t">ตรวจสอบแล้วสามารถจ่ายพัสดุ ครุภัณฑ์ตามรายการได้</div>
              <div class="Inspector">
                <div class="margin-l-Inspector">
                  <div>ลงชื่อ........................................ผู้ตรวจสอบ</div>
                  <div class="margin-t margin-center-Inspector">(........................................)</div>
                  <div class="margin-t">วันที่........./.................../.............</div>
                </div>
              </div>
            </div>
            <div class="box">
              <div>
                <label><input type="checkbox" disabled /> อนุมัติให้ยืมพัสดุ / ครุภัณฑ์</label><br />
                <label><input type="checkbox" class="margin-t" disabled /> ไม่อนุมัติ เนื่องจาก…………………………………</label>
                <p class="margin-t">…………………………………………………………</p>
              </div>
              <div class="Inspector2">
                <div class="margin-l-Inspector">
                  <div>ลงชื่อ........................................ผู้ให้ยืม</div>
                  <div class="margin-t margin-center-Inspector">(........................................)</div>
                  <div class="margin-t">วันที่........./.................../.............</div>
                </div>
              </div>
            </div>
            <div class="box">
              <div><h3 class="text-box3">ได้รับพัสดุตามรายการข้างต้นแล้ว</h3></div>
              <div class="Inspector">
                <div class="margin-l-Inspector">
                  <div>ลงชื่อ........................................ผู้ยืม</div>
                  <div class="margin-t margin-center-Inspector">(........................................)</div>
                  <div class="margin-t">วันที่........./.................../.............</div>
                </div>
              </div>
            </div>
            <div class="box">
              <div><h3 class="text-box3">การรับพัสดุ / ครุภัณฑ์ คืน</h3></div>
              <div class="flex-box">
                <label><input type="checkbox" disabled class="margin-t" /> สภาพสมบูรณ์</label>
                <label><input type="checkbox" disabled class="margin-t" /> สภาพไม่สมบูรณ์</label>
              </div>
              <div class="flex-box2">
                <label><input type="checkbox" class="margin-t" disabled /> ครบถ้วนตามรายการ</label>
                <label class="margit-l"><input type="checkbox" class="margin-t " disabled />ไม่ครบ ขาด.........รายการ</label>
              </div>
              <div class="Inspector2">
                <div class="margin-l-Inspector">
                  <div>ลงชื่อ........................................ผู้ตรวจสอบ</div>
                  <div class="margin-t margin-center-Inspector">(........................................)</div>
                  <div class="margin-t">วันที่........./.................../.............</div>
                </div>
              </div>
            </div>
          </div>
    `;

    // หน้าเพิ่มเติมสำหรับรายการที่เกิน 2 รายการ
    if (details.length > maxRowsPage1) {
      htmlContent += `<div class="page-break"></div>`;
      htmlContent += `
            <h3 id="h">เอกสารแนบ แบบฟอร์มขอยืมพัสดุ / ครุภัณฑ์ มหาวิทยาลัยพะเยา</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">ลำดับที่</th>
                  <th style="width: 38%;">รายการ</th>
                  <th style="width: 10%;">จำนวน</th>
                  <th style="width: 10%;">หน่วย</th>
                  <th style="width: 34%;">รหัสครุภัณฑ์</th>
                </tr>
              </thead>
              <tbody>
      `;
      let remainingRows = details.slice(maxRowsPage1).map((detail, i) => {
        const serialNumber = detail.equipmentInstance?.serialNumber || 'ไม่ระบุ';
        return `
            <tr>
              <td>${maxRowsPage1 + i + 1}</td>
              <td>${detail.equipment.name || 'ไม่ระบุ'}</td>
              <td>${detail.quantityBorrowed}</td>
              <td>${detail.equipment.unit || 'ไม่ระบุ'}</td>
              <td>${serialNumber}</td>
            </tr>
        `;
      }).join('');

      const maxRowsPage2 = 24;
      for (let i = details.length - maxRowsPage1; i < maxRowsPage2; i++) {
        remainingRows += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
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

    // สร้าง PDF
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2cm", bottom: "1.5cm", left: "2cm", right: "2cm" },
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
    
  }
}