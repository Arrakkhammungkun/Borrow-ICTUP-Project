//import { Resend } from 'resend';
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    //66023085@up.ac.th
    //arrak26092547@gmail.com
    const info = await transporter.sendMail({
      from: `"ระบบแจ้งเตือน" <${process.env.GMAIL_USER}>`,
      to: "arrak26092547@gmail.com",
      subject: "มีการแจ้งเตือนใหม่",
      text: `สวัสดีครับ\n\nมีการแจ้งเตือนใหม่ในระบบของคุณ\n\nรายละเอียดเพิ่มเติม:\n- ผู้ยืม: นายสมชาย\n- วันที่ยืม: 15 กันยายน 2025\n\nกรุณาตรวจสอบในระบบ`,
      html: ` 
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>สวัสดีครับ</h2>
            <p>มีการแจ้งเตือนใหม่ในระบบของคุณ</p>
            <p><strong>รายละเอียดเพิ่มเติม:</strong></p>
            <ul>
              <li>ผู้ยืม: นายสมชาย</li>
              <li>วันที่ยืม: 15 กันยายน 2025</li>
            </ul>
            <p>กรุณาเข้าสู่ระบบเพื่อตรวจสอบข้อมูลเพิ่มเติม</p>
          </body>
        </html>
        `,
    });

    return NextResponse.json({ success: true, info });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error });
  }
}
