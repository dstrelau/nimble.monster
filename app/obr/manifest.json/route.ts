import { NextResponse } from "next/server";

export async function GET() {
  const isProduction = process.env.NODE_ENV === "production";
  const title = isProduction ? "Nimble Nexus" : "Nimble Nexus (Dev)";

  const manifest = {
    name: "Nimble Monster Viewer",
    version: "1.0.0",
    manifest_version: 1,
    author: "Nimble Monster",
    homepage_url: process.env.NEXT_PUBLIC_APP_URL + "/obr",
    icon: "/obr/icon.svg",
    description: "Search and view Nimble Nexus",
    action: {
      title,
      icon: "/obr/icon.svg",
      popover: "/obr",
      height: 600,
      width: 400,
    },
  };

  return NextResponse.json(manifest);
}
