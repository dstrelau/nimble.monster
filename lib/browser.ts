import puppeteer, { type Browser } from "puppeteer-core";

const BROWSER_LAUNCH_TIMEOUT_MS = 10_000;
const BROWSER_PROTOCOL_TIMEOUT_MS = 30_000;

async function launchBrowser(): Promise<Browser> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

  return puppeteer.launch({
    executablePath,
    headless: true,
    timeout: BROWSER_LAUNCH_TIMEOUT_MS,
    protocolTimeout: BROWSER_PROTOCOL_TIMEOUT_MS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

export async function withBrowser<T>(
  render: (browser: Browser) => Promise<T>
): Promise<T> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    return await render(browser);
  } finally {
    await browser?.close();
  }
}
