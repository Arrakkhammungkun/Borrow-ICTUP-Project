import chromium from "@sparticuz/chromium";

export async function launchBrowser() {
  if (process.env.VERCEL) {
    const puppeteer = (await import("puppeteer-core")).default;

    return await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true, // ใช้ค่าจาก puppeteer โดยตรง
    });
  } else {
    const puppeteer = (await import("puppeteer")).default;
    return await puppeteer.launch({ headless: true });
  }
}
