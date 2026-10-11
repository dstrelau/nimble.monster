import type { Metadata } from "next";
import { parseDiceNotation } from "@/lib/dice";
import { SITE_NAME } from "@/lib/utils/branding";
import { DiceRollerClient } from "./dice-roller-client";

type Props = {
  searchParams: Promise<{ dice?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const dice = (await searchParams).dice;
  const title = `Dice Roller - ${SITE_NAME}`;
  const description =
    dice && parseDiceNotation(dice)
      ? `Roll ${dice}`
      : "Roll dice and explore their probabilities.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function DiceRollerPage({ searchParams }: Props) {
  const diceNotation = (await searchParams).dice || "3d6+2";

  return <DiceRollerClient initialDice={diceNotation} />;
}
