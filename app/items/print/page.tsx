import type { Metadata } from "next";
import { ItemCardPrinter } from "./ItemCardPrinter";

export const metadata: Metadata = {
  title: "Print Item Cards",
};

export default function PrintItemCardsPage() {
  return <ItemCardPrinter />;
}
