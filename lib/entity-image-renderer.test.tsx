import { cleanup, render } from "@testing-library/react";
import puppeteer from "puppeteer-core";
import { afterEach, expect, it, vi } from "vitest";
import { FormattedText } from "@/components/shared/FormattedText";
import { renderEntityImage } from "./entity-image-renderer";

vi.mock("puppeteer-core", () => ({
  default: {
    launch: async () => ({
      newPage: async () => ({
        on: () => {},
        evaluateOnNewDocument: async () => {},
        setViewport: async () => {},
        goto: async () => ({ status: () => 200 }),
        waitForFunction: async () => {},
        waitForSelector: async (selector: string) => {
          const card = document.querySelector(selector);
          return card
            ? {
                dispose: async () => {},
                boundingBox: async () =>
                  card.isConnected ? card.getBoundingClientRect() : null,
              }
            : null;
        },
        evaluate: async <T, R>(callback: (args: T) => R, args: T) => {
          // Hydration can replace a card after waitForSelector resolves.
          const card = document.querySelector("[id$='-test']");
          const replacement = card?.cloneNode(true);
          if (card && replacement) card.replaceWith(replacement);
          return callback(args);
        },
        screenshot: async (options: { clip: unknown }) => {
          expect(options.clip).toEqual({
            x: 12,
            y: 34,
            width: 400,
            height: 300,
          });
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it.each(["monster", "item", "companion", "family"] as const)(
  "exports a replaced %s card with condition text but no controls",
  async (entityType) => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
      new DOMRect(12, 34, 400, 300)
    );
    render(
      <div>
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
  }
);
