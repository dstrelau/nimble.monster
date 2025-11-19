"use client";

import { SSRSafe } from "@/components/SSRSafe";
import OwlbearExtensionClient from "./OwlbearExtensionClient";

// const OwlbearExtensionClient = dynamic(
//   () => import("./OwlbearExtensionClient"),
//   { ssr: false }
// );

export default function OwlbearExtensionPage() {
  return (
    <SSRSafe>
      <OwlbearExtensionClient />
    </SSRSafe>
  );
}
