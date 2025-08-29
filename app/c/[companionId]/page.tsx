import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/companion/Card";
import { CompanionDetailActions } from "@/components/CompanionDetailActions";
import { auth } from "@/lib/auth";
import {
  findCompanion,
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companionId: string }>;
}): Promise<Metadata> {
  const { companionId } = await params;
  const companion = await findCompanion(companionId);

  if (!companion) {
    return {
      title: "Companion Not Found",
    };
  }

  const creatorText = companion.creator
    ? ` by ${companion.creator.username}`
    : "";
  const companionInfo = [companion.kind, companion.class]
    .filter(Boolean)
    .join(" ");

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: companion.name,
    description: `${companion.name} - ${companionInfo}${creatorText} | nimble.monster`,
    openGraph: {
      title: companion.name,
      description: `${companionInfo}${creatorText}`,
      type: "article",
      url: `/c/${companion.id}`,
      images: [
        {
          url: `/c/${companion.id}/image`,
          alt: companion.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: companion.name,
      description: `${companionInfo}${creatorText}`,
      images: [`/c/${companion.id}/image`],
    },
  };
}

export default async function CompanionPage({
  params,
}: {
  params: Promise<{ companionId: string }>;
}) {
  const session = await auth();
  const { companionId } = await params;
  const companion = await findCompanion(companionId);

  if (!companion) {
    return notFound();
  }

  const [officialConditions, userConditions] = await Promise.all([
    listOfficialConditions(),
    listConditionsForDiscordId(companion.creator.discordId || ""),
  ]);
  const conditions = [...officialConditions, ...userConditions];

  // if companion is not public, then user must be creator
  const isOwner = session?.user?.id === companion.creator?.discordId || false;

  if (companion.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start mb-6">
        {isOwner && <CompanionDetailActions companion={companion} />}
      </div>
      <div className="max-w-2xl mx-auto">
        <Card
          companion={companion}
          creator={companion.creator}
          conditions={conditions}
          link={false}
        />
      </div>
    </div>
  );
}
