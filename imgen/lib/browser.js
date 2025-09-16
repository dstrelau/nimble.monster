const puppeteer = require("puppeteer");

let browser;

async function getBrowser() {
  if (browser) return browser;

  console.log("Launching browser locally");

  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  console.log("Browser launched successfully locally");

  return browser;
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = {
  getBrowser,
  closeBrowser,
};
