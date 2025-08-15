import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadMonsterConditions } from "@/app/actions/conditions";
import { Card } from "@/app/ui/monster/Card";
import { auth } from "@/lib/auth";
import { findMonster, findPublicMonsterById } from "@/lib/db";

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
  const isOwner = session?.user?.id === monster.creator?.discordId || false;

  if (monster.visibility !== "public" && !isOwner) {
    return notFound();
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["condition", monsterId],
    queryFn: () => loadMonsterConditions(monsterId),
    staleTime: 60 * 1000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card
            monster={monster}
            creator={monster.creator}
            link={false}
            hideActions={false}
            isOwner={isOwner}
          />
        </div>
      </div>
    </HydrationBoundary>
  );
}
