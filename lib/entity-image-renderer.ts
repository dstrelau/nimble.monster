import { trace } from "@opentelemetry/api";
import type { Browser } from "puppeteer-core";
import type { EntityImageTheme, EntityImageType } from "@/lib/db/schema";

export interface EntityImageRenderOptions {
  baseUrl: string;
  entityId: string;
  entityUrlPath: string;
  entityType: EntityImageType;
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
  const span = trace.getActiveSpan();
  const page = await browser.newPage();
  const entityPageUrl = new URL(entityUrlPath, baseUrl).toString();
  const selector = `#${entityType}-${entityId}`;
  let pageErrorCount = 0;
  page.on("pageerror", (error) => {
    pageErrorCount++;
    if (pageErrorCount <= 5) {
      span?.addEvent("page.error", {
        "exception.message": error.message,
      });
    }
  });
  span?.setAttributes({
    "page.entity.id": entityId,
    "page.entity.type": entityType,
    "page.entity.path": entityUrlPath,
    "page.theme": theme,
    "page.render.phase": "setup",
  });

  try {
    await page.evaluateOnNewDocument((selectedTheme: string) => {
      window.localStorage.setItem("theme", selectedTheme);
    }, theme);
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2,
    });

    span?.setAttribute("page.render.phase", "navigation");
    const navigationStartedAt = performance.now();
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
    span?.setAttributes({
      "page.navigation.duration_ms": performance.now() - navigationStartedAt,
      "page.response.status_code": response?.status() ?? 0,
    });

    if (!response || response.status() !== 200) {
      throw new Error(
        `Failed to load ${entityType} page: ${response?.status() ?? "no response"}`
      );
    }

    span?.setAttribute("page.render.phase", "assets");
    const assetsStartedAt = performance.now();
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
    span?.setAttribute(
      "page.assets.wait_duration_ms",
      performance.now() - assetsStartedAt
    );

    span?.setAttribute("page.render.phase", "selector");
    const selectorStartedAt = performance.now();
    const entityCard = await page.waitForSelector(selector, {
      timeout: 10_000,
      visible: true,
    });
    span?.setAttribute(
      "page.selector.wait_duration_ms",
      performance.now() - selectorStartedAt
    );
    if (!entityCard) {
      throw new Error(`${entityType} card element not found`);
    }
    await entityCard.dispose();

    // Linked entities load after hydration; don't export their placeholders.
    span?.setAttribute("page.render.phase", "content");
    const contentStartedAt = performance.now();
    await page.waitForFunction(
      (cardSelector) => {
        const card = document.querySelector(cardSelector);
        return card && !card.querySelector('[data-slot="skeleton"]');
      },
      { timeout: 10_000 },
      selector
    );
    span?.setAttribute(
      "page.content.wait_duration_ms",
      performance.now() - contentStartedAt
    );

    // Hydration can replace the element returned by waitForSelector. Prepare
    // and measure the current card together, without retaining a stale handle.
    span?.setAttribute("page.render.phase", "prepare");
    const boundingBox = await page.evaluate(
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

        // Inline reference buttons are card content, not export controls.
        document
          .querySelectorAll<HTMLElement>(
            `[id^="${type}-"] button:not(.formatted-text button), [id^="${type}-"] [data-card-export-hide]`
          )
          .forEach((element) => {
            element.style.display = "none";
          });

        const card = document.querySelector<HTMLElement>(cardSelector);
        if (!card) return null;
        card.style.padding = "20px";
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";

        const { x, y, width, height } = card.getBoundingClientRect();
        return width > 0 && height > 0
          ? { x: x + window.scrollX, y: y + window.scrollY, width, height }
          : null;
      },
      { cardSelector: selector, type: entityType }
    );

    if (!boundingBox) {
      throw new Error(`Could not determine ${entityType} card dimensions`);
    }

    span?.setAttribute("page.render.phase", "screenshot");
    const screenshotStartedAt = performance.now();
    const screenshot = await page.screenshot({
      clip: boundingBox,
      omitBackground: true,
      type: "png",
    });
    const image = Buffer.from(screenshot);
    span?.setAttributes({
      "page.screenshot.duration_ms": performance.now() - screenshotStartedAt,
      "page.screenshot.width": boundingBox.width,
      "page.screenshot.height": boundingBox.height,
      "page.screenshot.bytes": image.byteLength,
    });
    return image;
  } finally {
    span?.setAttribute("page.error.count", pageErrorCount);
    await page.close();
  }
}
