import type { Metadata } from "next";
import { ReferenceTableCardLab } from "./ReferenceTableCardLab";

export const metadata: Metadata = {
  title: "Reference Table Card Lab",
  robots: { index: false, follow: false },
};

export default function ReferenceTableCardLabPage() {
  return <ReferenceTableCardLab />;
}
