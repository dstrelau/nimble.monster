import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SourceBadge } from "./SourceBadge";

afterEach(cleanup);

it.each([
  false,
  true,
])("opens source details on tap and respects disableLink=%s", async (disableLink) => {
  render(
    <SourceBadge
      source={{
        id: "source-1",
        name: "Game Master's Guide",
        abbreviation: "GMG",
        license: "CC BY 4.0",
        link: "https://nimbleRPG.com",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      }}
      disableLink={disableLink}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "GMG" }));
  const details = await screen.findByRole("dialog", {
    name: "Game Master's Guide",
  });
  expect(details).toHaveTextContent("CC BY 4.0");
  if (disableLink) {
    expect(screen.queryByRole("link")).toBeNull();
  } else {
    expect(
      screen.getByRole("link", { name: "Game Master's Guide" })
    ).toHaveAttribute("href", "https://nimbleRPG.com");
  }
});
