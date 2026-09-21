import type { Browser } from "puppeteer-core";
import type { EntityImageTheme } from "@/lib/db/schema";

export interface EntityImageRenderOptions {
  baseUrl: string;
  entityId: string;
  entityUrlPath: string;
  entityType: "monster" | "companion" | "item";
  theme: EntityImageTheme;
}

export async function renderEntityImage(
  {
    baseUrl,
    entityId,
    entityUrlPath,
    entityType,
    theme,
  }: EntityImageRenderOptions,
  browser: Browser
): Promise<Buffer> {
  const page = await browser.newPage();
  const entityPageUrl = new URL(entityUrlPath, baseUrl).toString();
  const selector = `#${entityType}-${entityId}`;

  try {
    await page.evaluateOnNewDocument((selectedTheme: string) => {
      window.localStorage.setItem("theme", selectedTheme);
    }, theme);
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2,
    });

    let response = await page.goto(entityPageUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NIMBLE_DEV_AUTO_LOGIN_USERNAME &&
      response?.url() !== entityPageUrl
    ) {
      response = await page.goto(entityPageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
    }

    if (!response || response.status() !== 200) {
      throw new Error(
        `Failed to load ${entityType} page: ${response?.status() ?? "no response"}`
      );
    }

    await page
      .waitForFunction(
        () =>
          Array.from(
            document.querySelectorAll<HTMLImageElement>(
              'img[src*="cdn.discordapp.com"]'
            )
          ).every((image) => image.complete && image.naturalHeight !== 0),
        { timeout: 5_000 }
      )
      .catch(() => undefined);
    await page
      .waitForFunction(() => document.readyState === "complete", {
        timeout: 3_000,
      })
      .catch(() => undefined);

    const entityCard = await page.waitForSelector(selector, {
      timeout: 10_000,
    });
    if (!entityCard) {
      throw new Error(`${entityType} card element not found`);
    }

    await page.evaluate(
      ({ cardSelector, type }) => {
        const container = document.querySelector<HTMLElement>(
          ".container .max-w-2xl"
        );
        if (container) {
          container.style.boxSizing = "border-box";
          container.style.display = "flex";
          container.style.justifyContent = "center";
          container.style.alignItems = "center";
          container.style.margin = "0";
          container.style.padding = "0";
        }

        document
          .querySelectorAll<HTMLElement>(
            `[id^="${type}-"] button, [id^="${type}-"] [data-card-export-hide]`
          )
          .forEach((element) => {
            element.style.display = "none";
          });

        const card = document.querySelector<HTMLElement>(cardSelector);
        if (card) card.style.padding = "20px";
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
      },
      { cardSelector: selector, type: entityType }
    );

    const boundingBox = await entityCard.boundingBox();
    if (!boundingBox) {
      throw new Error(`Could not determine ${entityType} card dimensions`);
    }

    const screenshot = await page.screenshot({
      clip: boundingBox,
      omitBackground: true,
      type: "png",
    });
    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}
