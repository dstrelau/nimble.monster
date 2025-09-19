import "@/app/ui/global.css";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { cn, sans } from "@/lib/utils";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nimble Monster",
  description: "Create and organize monsters for the Nimble TTRPG system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={cn(sans.className)}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
