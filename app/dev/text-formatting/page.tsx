import type { Metadata } from "next";
import { TextFormattingLab } from "./TextFormattingLab";

export const metadata: Metadata = {
  title: "Text Formatting Dev Lab",
  robots: { index: false, follow: false },
};

export default function TextFormattingLabPage() {
  return <TextFormattingLab />;
}
