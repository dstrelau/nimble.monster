import type { NextRequest } from "next/server";
import { getBrowser } from "@/lib/browser";
import { findPublicMonsterById } from "@/lib/db";
import { isValidUUID } from "@/lib/utils/validation";

async function getMonsterImage(baseUrl: string, monsterId: string) {
  "use cache";
  const monsterPageUrl = `${baseUrl}/m/${monsterId}`;
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport to match OpenGraph dimensions (1200x630)
    await page.setViewport({ width: 1200, height: 630 });

    await page.goto(monsterPageUrl, {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector(`#monster-${monsterId}`);

    const OG_WIDTH = 1200;
    const OG_HEIGHT = 630;

    await page.evaluate(
      (params: { monsterId: string; OG_WIDTH: number; OG_HEIGHT: number }) => {
        const { monsterId, OG_WIDTH } = params;
        // Select the container of the monster card
        const container = document.querySelector(
          ".container .max-w-2xl"
        ) as HTMLElement | null;

        // Apply consistent styling for OpenGraph image
        if (container) {
          container.style.width = `${OG_WIDTH}px`;
          container.style.boxSizing = "border-box";
          container.style.display = "flex";
          container.style.justifyContent = "center";
          container.style.alignItems = "center";
          container.style.margin = "0";
          container.style.padding = "0";
        }

        // Remove unnecessary UI elements that shouldn't appear in the image
        const actionsToRemove = document.querySelectorAll(
          '[id^="monster-"] button'
        );
        actionsToRemove.forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });

        // Ensure the card has the right background and styling
        const monsterCard = document.querySelector(
          `#monster-${monsterId}`
        ) as HTMLElement | null;
        if (monsterCard) {
          // Ensure the card has proper padding for the image
          monsterCard.style.padding = "20px";
        }
      },
      { monsterId, OG_WIDTH, OG_HEIGHT }
    );

    const monsterCardElement = await page.$(`#monster-${monsterId}`);
    if (!monsterCardElement) {
      throw new Error("Monster card element not found");
    }

    // Get the card's dimensions
    const boundingBox = await monsterCardElement.boundingBox();
    if (!boundingBox) {
      throw new Error("Could not determine monster card dimensions");
    }

    // Capture the screenshot
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ monsterId: string }> }
) {
  const { monsterId } = await params;

  if (!isValidUUID(monsterId)) {
    return new Response("Monster not found", { status: 404 });
  }

  const monster = await findPublicMonsterById(monsterId);

  if (!monster) {
    return new Response("Monster not found", { status: 404 });
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = new URL(request.url).protocol;
  const baseUrl = `${protocol}//${host}`;

  try {
    const imageBuffer = await getMonsterImage(baseUrl, monster.id);
    // const etag = `"${monsterId}-${monster.updatedAt.getTime()}"`;
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating monster image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Error generating image: ${errorMessage}`, {
      status: 500,
    });
  } finally {
  }
}
