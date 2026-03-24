import "@/app/ui/global.css";
import {
  Fira_Sans_Condensed,
  PT_Serif,
  Roboto_Flex,
  Roboto_Serif,
  Roboto_Slab,
} from "next/font/google";
import { ConditionalFooter } from "@/app/ui/ConditionalFooter";
import { ConditionalHeader } from "@/app/ui/ConditionalHeader";
import { ConditionalMain } from "@/app/ui/ConditionalMain";
import { FreeBanner } from "@/app/ui/FreeBanner";
import { StaleDeploymentBanner } from "@/components/StaleDeploymentBanner";
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

const firaSansCondensed = Fira_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fira-sans-condensed",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-pt-serif",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body
        className={cn(
          "font-sans",
          sans.variable,
          slab.variable,
          serif.variable,
          firaSansCondensed.variable,
          ptSerif.variable
        )}
      >
        <Providers session={session}>
          <ConditionalHeader />
          <FreeBanner />
          <ConditionalMain>{children}</ConditionalMain>
          <ConditionalFooter />
          <StaleDeploymentBanner />
        </Providers>
      </body>
    </html>
  );
}
