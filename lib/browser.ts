import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

const remoteExecutablePath =
  "https://github.com/Sparticuz/chromium/releases/download/v138.0.0/chromium-v138.0.0-pack.tar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browser: any = null;

export async function getBrowser() {
  if (browser) return browser;

  if (process.env.VERCEL) {
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(remoteExecutablePath),
      headless: true,
    });
  } else {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
  }
  
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}