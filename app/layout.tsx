import "@/app/ui/global.css";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
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
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: theming
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const root = document.documentElement;
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
