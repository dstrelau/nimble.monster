import puppeteer, { type Browser } from "puppeteer";

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser) return browser;
  if (browserPromise) return browserPromise;

  browserPromise = puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  browser = await browserPromise;
  browserPromise = null;

  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
