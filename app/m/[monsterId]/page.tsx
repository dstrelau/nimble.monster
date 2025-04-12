import { findPublicMonsterById } from "@/lib/db";
import { Card } from "@/ui/monster/Card";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ monsterId: string }>;
}): Promise<Metadata> {
  const { monsterId } = await params;
  const monster = await findPublicMonsterById(monsterId);

  if (!monster) {
    return {
      title: "Monster Not Found",
    };
  }

  const creatorText = monster.creator ? ` by ${monster.creator.username}` : "";
  const monsterInfo = [monster.legendary ? "Legendary" : "", monster.kind || ""]
    .filter(Boolean)
    .join(" ");

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: monster.name,
    description: `${monster.name} - ${monsterInfo}${creatorText} | nimble.monster`,
    openGraph: {
      title: monster.name,
      description: `${monsterInfo}${creatorText}`,
      type: "article",
      url: `/m/${monsterId}`,
      images: [
        {
          url: `/m/${monsterId}/image`,
          alt: monster.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: monster.name,
      description: `${monsterInfo}${creatorText}`,
      images: [`/m/${monsterId}.png`],
    },
  };
}

export default async function MonsterPage({
  params,
}: {
  params: Promise<{ monsterId: string }>;
}) {
  const { monsterId } = await params;
  const monster = await findPublicMonsterById(monsterId);

  if (!monster) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card monster={monster} creator={monster.creator} showActions={false} />
      </div>
    </div>
  );
}
