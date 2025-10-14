import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteName } from "@/lib/utils/branding";
import {
  calculateAverageDamageOnHit,
  calculateProbabilityDistribution,
  calculateTotalAverageDamage,
  type DiceRoll,
  parseDiceNotation,
} from "../../lib/dice";
import { DiceRollerClient } from "./dice-roller-client";

type Props = {
  searchParams: Promise<{ dice?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const dice = (await searchParams).dice;

  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const siteName = getSiteName(hostname);

  try {
    let diceRoll: DiceRoll | null = null;
    if (dice) {
      diceRoll = parseDiceNotation(dice);
    }
    if (diceRoll) {
      const distribution = calculateProbabilityDistribution(diceRoll);
      const avgOnHit = calculateAverageDamageOnHit(distribution);
      const totalAvg = calculateTotalAverageDamage(distribution);
      const missProbability = distribution.get(0) || 0;

      const title = `Dice Roller - ${siteName}`;
      const description = `${dice}\nAvg ${totalAvg.toFixed(1)} (${avgOnHit.toFixed(1)} on hit)\n${(100 * missProbability).toFixed(1)}% miss`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: "website",
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
      };
    }
  } catch {}

  return {
    title: `Dice Roller - ${siteName}`,
    description:
      "Roll dice with exploding mechanics for the Nimble TTRPG system",
  };
}

export default async function DiceRollerPage({ searchParams }: Props) {
  const diceNotation = (await searchParams).dice || "3d6+2";

  return <DiceRollerClient initialDice={diceNotation} />;
}
