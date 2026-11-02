import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DiscordLoginButton } from "./DiscordLoginButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("starts OAuth at a stable URL without next-action, blocks duplicate clicks and navigates", async () => {
  let resolve: (value: Response) => void = () => {};
  const fetch = vi.fn<typeof globalThis.fetch>(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      })
  );
  const assign = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("location", { assign, href: "https://nimble.nexus/" });
  render(
    <form>
      <DiscordLoginButton />
    </form>
  );
  const button = screen.getByRole("button", { name: /Login with Discord/ });
  expect(button).toHaveAttribute("type", "button");
  fireEvent.click(button);
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  fireEvent.click(button);
  expect(fetch).toHaveBeenCalledOnce();
  const [url, options] = fetch.mock.calls[0] ?? [];
  expect(url).toBe("/_actions/signIn");
  expect(options).toEqual({
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  expect(new Headers(options?.headers).has("next-action")).toBe(false);
  await act(async () =>
    resolve(
      Response.json({
        url: "https://discord.com/api/oauth2/authorize?state=test",
      })
    )
  );
  expect(assign).toHaveBeenCalledWith(
    "https://discord.com/api/oauth2/authorize?state=test"
  );
});

it("keeps the page usable after HTTP or network failure and retries on another click", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ error: "Internal Server Error" }, { status: 500 })
    )
    .mockRejectedValueOnce(new Error("Network disconnected"))
    .mockResolvedValueOnce(
      Response.json({ url: "https://discord.com/oauth2/authorize" })
    );
  const assign = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("location", { assign, href: "https://nimble.nexus/" });
  render(<DiscordLoginButton />);
  const button = screen.getByRole("button", { name: /Login with Discord/ });
  for (let attempt = 0; attempt < 2; attempt++) {
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to start sign-in. Please try again."
    );
    expect(button).toBeEnabled();
    expect(assign).not.toHaveBeenCalled();
  }
  fireEvent.click(button);
  await waitFor(() => expect(assign).toHaveBeenCalledOnce());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
