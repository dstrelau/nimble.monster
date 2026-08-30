import "@/app/ui/global.css";
import type { Metadata } from "next";
import { Roboto_Flex, Roboto_Serif, Roboto_Slab } from "next/font/google";
import { getNavCountsAction } from "@/app/actions/nav";
import { Footer } from "@/components/layout/Footer";
import { FreeBanner } from "@/components/layout/FreeBanner";
import Header from "@/components/layout/Header";
import { StaleDeploymentBanner } from "@/components/layout/StaleDeploymentBanner";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const sans = Roboto_Flex({
  subsets: ["latin"],
  axes: ["wdth", "slnt", "opsz", "GRAD"],
  style: ["normal"],
  variable: "--font-roboto-sans",
});
const slab = Roboto_Slab({
  subsets: ["latin"],
  style: ["normal"],
  variable: "--font-roboto-slab",
});
const serif = Roboto_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-roboto-serif",
});

// Inherited by every route, so relative openGraph/twitter image URLs resolve
// against the real origin instead of Next's http://localhost:3000 fallback.
// Without this, link unfurlers (Discord, Slack, ...) get an unreachable image.
export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, navCounts] = await Promise.all([
    auth(),
    getNavCountsAction(),
  ]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`@media print { html { font-size: 87.5%; } }`}</style>
      </head>
      <body
        className={cn(
          "font-sans",
          sans.variable,
          slab.variable,
          serif.variable
        )}
      >
        <Providers session={session}>
          <Header initialCounts={navCounts} />
          <FreeBanner />
          <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
          <Footer />
          <StaleDeploymentBanner />
        </Providers>
      </body>
    </html>
  );
}
