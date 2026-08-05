import { describe, expect, it, vi } from "vitest";

// The layout pulls in fonts, auth and the whole provider tree; none of that is
// relevant to the metadata export under test.
vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Roboto_Flex: font, Roboto_Serif: font, Roboto_Slab: font };
});
vi.mock("@/app/ui/global.css", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("./providers", () => ({ Providers: () => null }));
vi.mock("@/components/layout/ConditionalFooter", () => ({
  ConditionalFooter: () => null,
}));
vi.mock("@/components/layout/ConditionalHeader", () => ({
  ConditionalHeader: () => null,
}));
vi.mock("@/components/layout/ConditionalMain", () => ({
  ConditionalMain: () => null,
}));
vi.mock("@/components/layout/FreeBanner", () => ({ FreeBanner: () => null }));
vi.mock("@/components/layout/StaleDeploymentBanner", () => ({
  StaleDeploymentBanner: () => null,
}));

describe("root layout metadata", () => {
  // Every route inherits metadataBase from the root layout. Without it, Next
  // resolves relative openGraph/twitter image URLs against localhost:3000, so
  // link unfurlers (Discord, Slack, ...) get an unreachable image and show no
  // preview. Pages must not have to opt in individually.
  it("sets metadataBase from NEXT_PUBLIC_APP_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://nimble.nexus");
    vi.resetModules();

    const { metadata } = await import("./layout");

    expect(metadata.metadataBase?.toString()).toBe("https://nimble.nexus/");
    vi.unstubAllEnvs();
  });

  it("leaves metadataBase unset when NEXT_PUBLIC_APP_URL is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.resetModules();

    const { metadata } = await import("./layout");

    expect(metadata.metadataBase).toBeUndefined();
    vi.unstubAllEnvs();
  });
});
