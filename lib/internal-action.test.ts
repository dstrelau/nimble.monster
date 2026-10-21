import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { internalAction } from "./internal-action";

function request(
  headers: Record<string, string> = {},
  url = "https://nimble.nexus/_actions/test"
) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: new URL(url).origin,
      ...headers,
    },
    body: "{}",
  });
}

function okHandler() {
  return vi.fn(async () => NextResponse.json({ ok: true }));
}

describe("internalAction", () => {
  it("allows an exact origin including its scheme and port", async () => {
    const handler = okHandler();
    const action = internalAction("application/json", handler);

    const response = await action(
      request({}, "http://localhost:3000/_actions/test")
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it.each([
    ["mismatched", "https://attacker.example"],
    ["wrong scheme", "http://nimble.nexus"],
    ["wrong port", "https://nimble.nexus:444"],
    ["malformed", "not an origin"],
  ])("rejects a %s Origin", async (_label, origin) => {
    const handler = okHandler();
    const response = await internalAction(
      "application/json",
      handler
    )(request({ origin }));

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("rejects missing origin evidence", async () => {
    const handler = okHandler();
    const missingOriginRequest = request();
    missingOriginRequest.headers.delete("origin");
    const response = await internalAction(
      "application/json",
      handler
    )(missingOriginRequest);

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("allows the conservative Origin fallback with same-origin Fetch Metadata and Referer", async () => {
    const handler = okHandler();
    const action = internalAction("application/json", handler);
    const fallbackRequest = request({
      origin: "",
      referer: "https://nimble.nexus/adventures/new",
      "sec-fetch-site": "same-origin",
    });
    fallbackRequest.headers.delete("origin");

    const response = await action(fallbackRequest);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it.each([
    ["cross-site metadata", "cross-site", "https://nimble.nexus/page"],
    ["cross-site Referer", "same-origin", "https://attacker.example/page"],
    ["malformed Referer", "same-origin", "not a URL"],
  ])("rejects fallback evidence with %s", async (_label, site, referer) => {
    const handler = okHandler();
    const fallbackRequest = request({
      origin: "",
      referer,
      "sec-fetch-site": site,
    });
    fallbackRequest.headers.delete("origin");

    const response = await internalAction(
      "application/json",
      handler
    )(fallbackRequest);

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses the trusted forwarded host and protocol convention", async () => {
    const handler = okHandler();
    const response = await internalAction(
      "application/json",
      handler
    )(
      request({
        origin: "https://portal.example:8443",
        "x-forwarded-host": "portal.example:8443",
        "x-forwarded-proto": "https",
      })
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it.each([
    "text/plain",
    "application/x-www-form-urlencoded",
  ])("rejects a %s simple-request CSRF body before the handler", async (contentType) => {
    const handler = okHandler();
    const response = await internalAction(
      "application/json",
      handler
    )(request({ "content-type": contentType }));

    expect(response.status).toBe(415);
    expect(handler).not.toHaveBeenCalled();
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("accepts multipart/form-data with a browser boundary", async () => {
    const handler = okHandler();
    const response = await internalAction(
      "multipart/form-data",
      handler
    )(
      request({
        "content-type": "multipart/form-data; boundary=browser-boundary",
      })
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("converts unexpected failures to a generic response", async () => {
    const action = internalAction("application/json", async () => {
      throw new Error("database hostname and query leaked");
    });

    const response = await action(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
