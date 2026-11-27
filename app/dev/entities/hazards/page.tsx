import type { Metadata } from "next";
import { HazardLab } from "./HazardLab";

export const metadata: Metadata = {
  title: "Hazard Entity Lab",
  robots: { index: false, follow: false },
};

export default function HazardLabPage() {
  return <HazardLab />;
}
