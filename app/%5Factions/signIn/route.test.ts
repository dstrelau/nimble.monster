import { trace } from "@opentelemetry/api";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("@/lib/auth", () => ({ signIn }));

import { POST } from "./route";

const authorizationUrl = "https://discord.com/api/oauth2/authorize?state=test";
const request = (body = "{}", headers: Record<string, string> = {}) =>
  new Request("https://nimble.nexus/_actions/signIn", {
    method: "POST",
    body,
    headers: {
      origin: "https://nimble.nexus",
      "content-type": "application/json",
      referer: "https://nimble.nexus/backgrounds/new?draft=1",
      ...headers,
    },
  });

beforeEach(() => {
  signIn.mockReset().mockResolvedValue(authorizationUrl);
});
afterEach(() => vi.restoreAllMocks());

it("starts Discord sign-in without requiring a session and returns JSON, not a redirect", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("location")).toBe(false);
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual({ url: authorizationUrl });
  expect(signIn).toHaveBeenCalledWith("discord", {
    redirect: false,
    redirectTo: "https://nimble.nexus/backgrounds/new?draft=1",
  });
  await POST(request("{}", { referer: "" }));
  expect(signIn).toHaveBeenLastCalledWith("discord", {
    redirect: false,
    redirectTo: "/",
  });
});

it("rejects forged origins and simple-request bodies before initiating OAuth", async () => {
  for (const [headers, status] of [
    [{ origin: "https://attacker.example" }, 403],
    [{ origin: "null" }, 403],
    [{ "content-type": "text/plain" }, 415],
    [{ "content-type": "application/x-www-form-urlencoded" }, 415],
  ] satisfies [Record<string, string>, number][]) {
    expect((await POST(request("{}", headers))).status).toBe(status);
  }
  const missing = request();
  missing.headers.delete("origin");
  expect((await POST(missing)).status).toBe(403);
  expect(signIn).not.toHaveBeenCalled();
  missing.headers.set("sec-fetch-site", "same-origin");
  expect((await POST(missing)).status).toBe(200);
});

it("distinguishes malformed JSON and invalid inputs without accepting provider or redirect authority", async () => {
  const malformed = await POST(request("{"));
  expect(malformed.status).toBe(400);
  expect(await malformed.json()).toEqual({ error: "Invalid JSON body" });
  for (const body of [
    "null",
    "[]",
    '"text"',
    '{"provider":"dev"}',
    '{"redirectTo":"https://attacker.example"}',
  ]) {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid request" });
  }
  expect(signIn).not.toHaveBeenCalled();
});

it("records unexpected auth errors and returns a generic failure", async () => {
  const span = trace.getTracer("test").startSpan("signin");
  const recordException = vi.spyOn(span, "recordException");
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  signIn.mockRejectedValueOnce(new Error("private OAuth details"));
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(recordException).toHaveBeenCalled();
});
