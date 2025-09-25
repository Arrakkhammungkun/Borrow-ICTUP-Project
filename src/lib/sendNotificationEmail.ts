// /lib/notificationEmail.ts
import { sendEmail } from "@/lib/sendEmail";

type NotificationType =
  | "BORROW_APPROVED"
  | "BORROW_PENDING"
  | "RETURN_COMPLETED"
  | "BORROW_REJECTED"
  | "NEAR_DUE"
  | "DUE_TODAY"
  | "OVERDUE"; 

interface NotificationData {
  to: string; 
  firstName: string; 
  lastName: string;
  borrowId: number;
  borrowDate?: string; 
  returnDate?: string; 
  borrowerName?: string;
  conditionAfterReturn?: string;
}

export async function sendNotificationEmail(
  type: NotificationType,
  data: NotificationData
) {
  let subject = "";
  let htmlBody = "";

  switch (type) {
    case "BORROW_APPROVED":
      subject = "คำขอยืมอุปกรณ์/ครุภัณฑ์ได้รับการอนุมัติแล้ว";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>คำขอยืมอุปกรณ์/ครุภัณฑ์ของคุณได้รับการอนุมัติเรียบร้อยแล้ว</p>
        <p><strong>รายละเอียดดังนี้:</strong></p>
        <ul>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันที่คืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
        </ul>
        <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบข้อมูลเพิ่มเติม</p>
      `;
      break;
    case "BORROW_REJECTED":
      subject = "คำขอยืมอุปกรณ์/ครุภัณฑ์ของคุณไม่ได้รับการอนุมัติ ";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>คำขอยืมอุปกรณ์/ครุภัณฑ์ของคุณไม่ได้รับการอนุมัติ</p>
        <p><strong>รายละเอียดดังนี้:</strong></p>
        <ul>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันที่คืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
        </ul>
        <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบข้อมูลเพิ่มเติม</p>
      `;
      break;

    case "BORROW_PENDING":
      subject = "มีคำขอยืมรอการอนุมัติ";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>มีผู้ยืมอุปกรณ์/ครุภัณฑ์ รายละเอียดดังนี้:</p>
        <ul>
          <li>ผู้ยืม: ${data.borrowerName}</li>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันที่คืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
        </ul>
        <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการอนุมัติ</p>
      `;
      break;

    case "RETURN_COMPLETED":
      subject = "การคืนอุปกรณ์เสร็จสิ้นแล้ว";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>ระบบได้บันทึกการคืนอุปกรณ์/ครุภัณฑ์ของคุณเรียบร้อยแล้ว</p>
        <p><strong>รายละเอียดดังนี้:</strong></p>
        <ul>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันที่คืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
          <li>รายละเอียดการคืน: ${data.conditionAfterReturn}</li>
        </ul>
        <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบสถานะการยืมของคุณ</p>
      `;
      break;

    case "NEAR_DUE":
      subject = "อุปกรณ์ใกล้ครบกำหนดส่งคืน";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>อุปกรณ์/ครุภัณฑ์ที่คุณยืมกำลังใกล้ครบกำหนดส่งคืน</p>
        <p><strong>รายละเอียดดังนี้:</strong></p>
        <ul>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันครบกำหนดส่งคืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
        </ul>
        <p>กรุณาวางแผนส่งคืนภายในกำหนดเพื่อหลีกเลี่ยงค่าปรับ</p>
      `;
      break;

    case "DUE_TODAY":
      subject = "วันนี้ครบกำหนดส่งคืนอุปกรณ์";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>วันนี้เป็นวันครบกำหนดส่งคืนอุปกรณ์/ครุภัณฑ์ที่คุณยืม</p>
        <p><strong>รายละเอียดดังนี้:</strong></p>
        <ul>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันครบกำหนดส่งคืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
        </ul>
        <p>กรุณาดำเนินการส่งคืนภายในวันนี้</p>
      `;
      break;

    case "OVERDUE":
      subject = "อุปกรณ์เกินกำหนดส่งคืนแล้ว";
      htmlBody = `
        <p>เรียน คุณ <strong>${data.firstName} ${data.lastName}</strong></p>
        <p>อุปกรณ์/ครุภัณฑ์ที่คุณยืมเกินกำหนดส่งคืนแล้ว</p>
        <p><strong>รายละเอียดดังนี้:</strong></p>
        <ul>
          <li>วันที่ยืม: ${data.borrowDate}</li>
          <li>วันครบกำหนดส่งคืน: ${data.returnDate}</li>
          <li>เลขที่ใบยืม: ${data.borrowId}</li>
        </ul>
        <p>กรุณารีบดำเนินการส่งคืนโดยเร็วที่สุด</p>
      `;
      break;
  }
  // Template กลาง
  const html = `
    <html>
      <style>
        .footer {
          text-align: center;
          font-size: 12px;
          color: #999999;
          padding: 15px;
          background: #f9f9f9;
        }
      </style>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${htmlBody}
        <div class="footer">
          © 2025 ระบบยืมคืนคณะ ICT | ข้อความนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: data.to,
    subject,
    text: subject,
    html,
  });
}
