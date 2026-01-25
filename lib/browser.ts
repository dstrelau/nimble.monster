import puppeteer, { type Browser } from "puppeteer-core";

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser) return browser;
  if (browserPromise) return browserPromise;

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

  browserPromise = puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote",
    ],
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
