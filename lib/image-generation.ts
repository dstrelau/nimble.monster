import { unstable_cacheTag as cacheTag } from "next/cache";
import { getBrowser } from "@/lib/browser";

export interface ImageGenerationOptions {
  baseUrl: string;
  entityId: string;
  entityType: "monster" | "companion" | "item";
}

export async function generateEntityImage({
  baseUrl,
  entityId,
  entityType,
}: ImageGenerationOptions): Promise<Buffer> {
  "use cache";

  cacheTag(`${entityType}-image-${entityId}`);
  const entityPageUrl = (() => {
    switch (entityType) {
      case "monster":
        return `${baseUrl}/m/${entityId}`;
      case "companion":
        return `${baseUrl}/c/${entityId}`;
      case "item":
        return `${baseUrl}/items/${entityId}`;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  })();
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

    const response = await page.goto(entityPageUrl, {
      waitUntil: "networkidle0",
    });

    if (!response || response.status() !== 200) {
      throw new Error(
        `Failed to load ${entityType} page: ${response?.status() || "unknown error"}`
      );
    }

    await page.waitForSelector(`#${entityType}-${entityId}`);

    await page.evaluate(
      (params: { entityId: string; entityType: string }) => {
        const { entityId, entityType } = params;
        // Select the container of the entity card
        const container = document.querySelector(
          ".container .max-w-2xl"
        ) as HTMLElement | null;

        // Apply consistent styling for OpenGraph image
        if (container) {
          // container.style.width = `${OG_WIDTH}px`;
          container.style.boxSizing = "border-box";
          container.style.display = "flex";
          container.style.justifyContent = "center";
          container.style.alignItems = "center";
          container.style.margin = "0";
          container.style.padding = "0";
        }

        // Remove unnecessary UI elements that shouldn't appear in the image
        const actionsToRemove = document.querySelectorAll(
          `[id^="${entityType}-"] button`
        );
        actionsToRemove.forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });

        // Ensure the card has the right background and styling
        const entityCard = document.querySelector(
          `#${entityType}-${entityId}`
        ) as HTMLElement | null;
        if (entityCard) {
          // Ensure the card has proper padding for the image
          entityCard.style.padding = "20px";
        }
      },
      { entityId, entityType }
    );

    const entityCardElement = await page.$(`#${entityType}-${entityId}`);
    if (!entityCardElement) {
      throw new Error(`${entityType} card element not found`);
    }

    // Get the card's dimensions
    const boundingBox = await entityCardElement.boundingBox();
    if (!boundingBox) {
      throw new Error(`Could not determine ${entityType} card dimensions`);
    }

    const screenshotBuffer = await page.screenshot({
      clip: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
      omitBackground: true,
      type: "png",
    });

    return Buffer.from(screenshotBuffer);
  } finally {
    await page.close();
  }
}
