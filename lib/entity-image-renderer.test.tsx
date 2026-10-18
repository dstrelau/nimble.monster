import { cleanup, render } from "@testing-library/react";
import puppeteer from "puppeteer-core";
import { afterEach, expect, it, vi } from "vitest";
import { FormattedText } from "@/components/shared/FormattedText";
import { renderEntityImage } from "./entity-image-renderer";

vi.mock("puppeteer-core", () => ({
  default: {
    launch: async () => ({
      newPage: async () => ({
        evaluateOnNewDocument: async () => {},
        setViewport: async () => {},
        goto: async () => ({ status: () => 200 }),
        waitForFunction: async () => {},
        waitForSelector: async (selector: string) =>
          document.querySelector(selector)
            ? {
                boundingBox: async () => ({
                  x: 0,
                  y: 0,
                  width: 400,
                  height: 300,
                }),
              }
            : null,
        evaluate: async <T,>(callback: (args: T) => void, args: T) =>
          callback(args),
        screenshot: async () => {
          // Observe the export DOM at capture time, not which selectors were used.
          expect(
            document.querySelector(".formatted-text button")
          ).toBeVisible();
          expect(document.querySelector(".formatted-text")).toHaveTextContent(
            "Inflicts poison and Unknown."
          );
          expect(
            document.querySelector("[aria-label='share']")
          ).not.toBeVisible();
          expect(
            document.querySelector("[data-card-export-hide]")
          ).not.toBeVisible();
          return Buffer.from("image");
        },
        close: async () => {},
      }),
    }),
  },
}));

afterEach(cleanup);

it.each([
  "monster",
  "item",
  "companion",
  "family",
] as const)("keeps condition text in %s images while hiding card controls", async (entityType) => {
  render(
    <div id={`${entityType}-test`}>
      <FormattedText
        content="Inflicts [[Poisoned|poison]] and [[Unknown]]."
        conditions={[
          {
            id: "poisoned",
            name: "Poisoned",
            description: "Poison",
            official: true,
          },
        ]}
      />
      <button type="button" aria-label="share">
        Share
      </button>
      <div data-card-export-hide>
        <button type="button">Upvote</button>
      </div>
    </div>
  );
  const browser = await puppeteer.launch();
  await expect(
    renderEntityImage(
      {
        baseUrl: "https://example.com",
        entityUrlPath: `/${entityType}s/test`,
        entityId: "test",
        entityType,
        theme: "light",
      },
      browser
    )
  ).resolves.toEqual(Buffer.from("image"));
});
