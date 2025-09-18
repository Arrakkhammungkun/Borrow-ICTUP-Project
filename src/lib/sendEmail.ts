import nodemailer from "nodemailer";

export async function sendEmail({
    to,
    subject,
    text,
    html,
}:{
    to:string;
    subject:string;
    text: string;
    html:string;
}){
    const transporter =nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.GMAIL_USER,
            pass:process.env.GMAIL_PASS,
        }
    })
    const info =await transporter.sendMail({
        from:`"ระบบแจ้งเตือน" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text,
        html,

    })
    return info
}   
