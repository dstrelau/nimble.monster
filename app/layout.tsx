import type { Metadata } from "next";
import "@/ui/global.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nimble Monster",
  description: "Create and organize monsters for the Nimble TTRPG system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
