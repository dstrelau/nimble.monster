import type { Metadata } from "next";
import { ItemLab } from "./ItemLab";

export const metadata: Metadata = {
  title: "Item Entity Lab",
  robots: { index: false, follow: false },
};

export default function ItemLabPage() {
  return <ItemLab />;
}
