import type { Metadata } from "next";
import { MonsterCardLab } from "./MonsterCardLab";

export const metadata: Metadata = {
  title: "Monster Card Viewer",
  robots: { index: false, follow: false },
};

export default function MonsterCardPage() {
  return <MonsterCardLab />;
}
