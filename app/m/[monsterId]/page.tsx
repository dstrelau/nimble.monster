import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/monster/Card";
import { MonsterDetailActions } from "@/components/MonsterDetailActions";
import { auth } from "@/lib/auth";
import { findMonster } from "@/lib/db";
import { AddToCollectionDialog } from "./AddToCollectionDialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ monsterId: string }>;
}): Promise<Metadata> {
  const { monsterId } = await params;
  const monster = await findMonster(monsterId);

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
      url: `/m/${monster.id}`,
      images: [
        {
          url: `/m/${monster.id}/image`,
          alt: monster.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: monster.name,
      description: `${monsterInfo}${creatorText}`,
      images: [`/m/${monster.id}/image`],
    },
  };
}

export default async function MonsterPage({
  params,
}: {
  params: Promise<{ monsterId: string }>;
}) {
  const session = await auth();
  const { monsterId } = await params;
  const monster = await findMonster(monsterId);

  if (!monster) {
    return notFound();
  }

  // if monster is not public, then user must be creator
  const isOwner =
    session?.user?.discordId === monster.creator?.discordId || false;

  if (monster.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <MonsterDetailActions monster={monster} />}
        {session?.user && <AddToCollectionDialog monsterId={monster.id} />}
      </div>
      <div className="max-w-2xl mx-auto">
        <Card monster={monster} creator={monster.creator} link={false} />
      </div>
    </div>
  );
}
