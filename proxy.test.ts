import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("ALLOWED_ORIGINS", "tail26991.ts.net");

vi.mock("@/lib/auth", () => ({
  auth: (callback: (req: NextRequest) => Response | undefined) => {
    return (request: NextRequest) =>
      callback(Object.assign(request, { auth: null }));
  },
}));

const { default: proxy } = (await import("./proxy")) as unknown as {
  default: (req: NextRequest) => Promise<Response | undefined>;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it("allows POST from the request host on a development portal", async () => {
    const req = makeRequest("POST", "https://portal.example.com/monsters", {
      host: "portal.example.com",
      "next-action": "abc123",
      origin: "https://portal.example.com",
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

  it("rejects POST with Next-Action but old domain origin", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
      origin: "https://nimble.monster",
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

  it("allows a same-origin browser POST when Origin is omitted", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
      referer: "http://nimble.nexus/monsters/abc-123",
      "sec-fetch-site": "same-origin",
    });
    const res = await proxy(req);
    expect(res?.status).not.toBe(400);
  });

  it("rejects an origin-less cross-site browser POST", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
      referer: "https://evil.com/attack",
      "sec-fetch-site": "cross-site",
    });
    const res = await proxy(req);
    expect(res?.status).toBe(400);
  });

  it("allows POST to /api/ routes", async () => {
    const req = makeRequest("POST", "/api/monsters");
    const res = await proxy(req);
    expect(res?.status).not.toBe(400);
  });

  it("allows POST to /_actions/ routes", async () => {
    const req = makeRequest("POST", "/_actions/createAdventure");
    const res = await proxy(req);
    expect(res?.status).not.toBe(400);
  });

  it("allows POST with Next-Action and ALLOWED_ORIGINS origin", async () => {
    const req = makeRequest("POST", "/monsters/abc-123", {
      "next-action": "abc123",
      origin: "http://devbox.tail26991.ts.net:3000",
    });
    const res = await proxy(req);
    expect(res?.status).not.toBe(400);
  });

  it("allows GET requests", async () => {
    const req = makeRequest("GET", "/monsters/abc-123");
    const res = await proxy(req);
    expect(res?.status).toBe(200);
  });

  it("automatically logs portal users in with the configured dev user", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NIMBLE_DEV_AUTO_LOGIN_USERNAME", "admin");
    vi.stubEnv("AUTH_URL", "https://portal.example.com");

    const req = makeRequest("GET", "/");
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe(
      "https://portal.example.com/api/auth/dev-login?dev-login=&username=admin"
    );
  });

  it("does not redirect auth API requests when dev auto-login is enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NIMBLE_DEV_AUTO_LOGIN_USERNAME", "admin");

    const req = makeRequest("GET", "/api/auth/session");
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

  it("does not redirect nimble.monster nimbrew.json routes", async () => {
    const req = makeRequest("GET", "/monsters/abc-123/nimbrew.json", {
      host: "nimble.monster",
    });
    const res = await proxy(req);
    expect(res?.status).not.toBe(308);
  });
});
