import type { Metadata } from "next";
import { RandomTableLab } from "./RandomTableLab";

export const metadata: Metadata = {
  title: "Table Editor Lab",
  robots: { index: false, follow: false },
};

export default function RandomTableLabPage() {
  return <RandomTableLab />;
}
