import puppeteer, { type Browser } from "puppeteer-core";

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

interface BrowserConnection {
  isConnected(): boolean;
}

export function isUsableBrowser(candidate: BrowserConnection | null): boolean {
  return candidate?.isConnected() ?? false;
}

class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      next?.();
    } else {
      this.permits++;
    }
  }
}

const renderSemaphore = new Semaphore(2);

export async function withRenderLimit<T>(fn: () => Promise<T>): Promise<T> {
  await renderSemaphore.acquire();
  try {
    return await fn();
  } finally {
    renderSemaphore.release();
  }
}

export async function getBrowser(): Promise<Browser> {
  if (browser && isUsableBrowser(browser)) return browser;
  browser = null;
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

  try {
    const launchedBrowser = await browserPromise;
    browser = launchedBrowser;
    launchedBrowser.once("disconnected", () => {
      if (browser === launchedBrowser) {
        browser = null;
      }
    });
    return launchedBrowser;
  } finally {
    browserPromise = null;
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
