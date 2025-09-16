import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";

// keep in sync with puppeteer version requirement
// https://pptr.dev/supported-browsers
const remoteExecutablePath =
  "https://github.com/Sparticuz/chromium/releases/download/v138.0.2/chromium-v138.0.2-pack.x64.tar";

// biome-ignore lint/suspicious/noExplicitAny: Browser types make no sense
let browser: any;

export async function getBrowser() {
  if (browser) return browser;

  if (process.env.VERCEL) {
    console.log("Launching browser on Vercel with chromium", {
      remoteExecutablePath,
      chromiumArgs: chromium.args.length,
    });

    const executablePath = await chromium.executablePath(remoteExecutablePath);
    console.log("Chromium executable path resolved:", executablePath);

    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    console.log("Browser launched successfully on Vercel");
  } else {
    console.log("Launching browser locally");

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    console.log("Browser launched successfully locally");
  }

  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
