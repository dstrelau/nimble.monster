import type { Metadata } from "next";
import { parseDiceNotation } from "nimble-dice";
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

  if (!dice || !parseDiceNotation(dice)) {
    return {
      title,
      description: "Roll dice and explore their probabilities.",
    };
  }

  const description = `Roll ${dice}`;

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
