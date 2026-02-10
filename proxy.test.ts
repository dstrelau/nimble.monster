import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: (callback: (req: NextRequest) => Response | undefined) => {
    return (request: NextRequest) =>
      callback(Object.assign(request, { auth: null }));
  },
}));

const { default: proxy } = (await import("./proxy")) as unknown as {
  default: (req: NextRequest) => Promise<Response | undefined>;
};

function makeRequest(
  method: string,
  url: string,
  headers?: Record<string, string>
) {
  return new NextRequest(new URL(url, "http://nimble.nexus"), {
    method,
    headers,
  });
}

describe("proxy", () => {
  it("rejects POST to page route without Next-Action header", async () => {
    const req = makeRequest("POST", "/monsters/abc-123");
    const res = await proxy(req);
    expect(res?.status).toBe(400);
  });

  it("allows POST to page route with Next-Action header and valid origin", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
      origin: "https://nimble.nexus",
    });
    const res = await proxy(req);
    expect(res?.status).not.toBe(400);
  });

  it("rejects POST with Next-Action but spoofed origin", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
      origin: "https://evil.com",
    });
    const res = await proxy(req);
    expect(res?.status).toBe(400);
  });

  it("rejects POST with Next-Action but missing origin", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
    });
    const res = await proxy(req);
    expect(res?.status).toBe(400);
  });

  it("allows POST to /api/ routes", async () => {
    const req = makeRequest("POST", "/api/monsters");
    const res = await proxy(req);
    expect(res?.status).not.toBe(400);
  });

  it("allows GET requests", async () => {
    const req = makeRequest("GET", "/monsters/abc-123");
    const res = await proxy(req);
    expect(res?.status).toBe(200);
  });

  it("redirects nimble.monster to nimble.nexus", async () => {
    const req = makeRequest("GET", "/monsters", {
      host: "nimble.monster",
    });
    const res = await proxy(req);
    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toContain("nimble.nexus");
  });
});
