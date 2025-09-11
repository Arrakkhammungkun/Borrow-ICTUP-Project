import chromium from "@sparticuz/chromium";

export async function launchBrowser() {
  if (process.env.VERCEL) {
    const puppeteer = (await import("puppeteer-core")).default;

    return await puppeteer.launch({
      args: [...chromium.args, '--font-render-hinting=medium', '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: true, 
    });
  } else {
    const puppeteer = (await import("puppeteer")).default;
    return await puppeteer.launch({ headless: true });
  }
}
