// nimble.monster/app/m/[monsterId]/image/route.tsx
import { findPublicMonsterById } from "@/lib/db";
import { NextRequest } from "next/server";
import puppeteer from "puppeteer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ monsterId: string }> },
) {
  const { monsterId } = await params;
  const monster = await findPublicMonsterById(monsterId);

  if (!monster) {
    return new Response("Monster not found", { status: 404 });
  }

  // Get the base URL from the request
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = new URL(request.url).protocol;
  const baseUrl = `${protocol}//${host}`;

  // Construct the URL to the monster's page
  const monsterPageUrl = `${baseUrl}/m/${monsterId}`;

  // Launch browser and navigate to the actual URL
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to match OpenGraph dimensions (1200x630)
  await page.setViewport({ width: 1200, height: 630 });

  try {
    // Navigate to the monster page
    await page.goto(monsterPageUrl, {
      waitUntil: "networkidle0",
    });

    // Wait for the monster card to be rendered
    await page.waitForSelector(`#monster-${monsterId}`);

    // Define the target OpenGraph dimensions
    const OG_WIDTH = 1200;
    const OG_HEIGHT = 630;
    
    // Apply custom styling to match OpenGraph dimensions and clean up the card
    await page.evaluate((params) => {
      const { monsterId, OG_WIDTH } = params;
      // Select the container of the monster card
      const container = document.querySelector(
        ".container .max-w-2xl",
      ) as HTMLElement | null;

      // Apply consistent styling for OpenGraph image
      if (container) {
        // Set dimensions to match OpenGraph metadata dimensions
        container.style.width = `${OG_WIDTH}px`;
        container.style.boxSizing = 'border-box';
        // Set padding and center content
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';

        // Remove any margins from the container to ensure clean screenshot
        container.style.margin = "0";
        container.style.padding = "0";
      }

      // Remove unnecessary UI elements that shouldn't appear in the image
      const actionsToRemove = document.querySelectorAll(
        '[id^="monster-"] button',
      );
      actionsToRemove.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // Ensure the card has the right background and styling
      const monsterCard = document.querySelector(`#monster-${monsterId}`) as HTMLElement | null;
      if (monsterCard) {
        // Ensure the card has proper padding for the image
        monsterCard.style.padding = "20px";
      }
    }, { isLegendary: monster.legendary, monsterId, OG_WIDTH, OG_HEIGHT });

    // Take a screenshot of the monster card element with fixed size for OpenGraph
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
        height: boundingBox.height
      },
      omitBackground: true,
      type: "png",
    });

    // Return the image
    return new Response(screenshotBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error: unknown) {
    console.error("Error generating monster image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Error generating image: ${errorMessage}`, {
      status: 500,
    });
  } finally {
    await browser.close();
  }
}
