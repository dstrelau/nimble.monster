import "@/ui/global.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { auth } from "./lib/auth";

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
    <html lang="en">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
