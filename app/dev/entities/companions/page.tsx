import type { Metadata } from "next";
import { CompanionLab } from "./CompanionLab";

export const metadata: Metadata = {
  title: "Companion Entity Lab",
  robots: { index: false, follow: false },
};

export default function CompanionLabPage() {
  return <CompanionLab />;
}
