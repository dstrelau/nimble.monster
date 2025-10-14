import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Card } from "@/app/ui/companion/Card";
import { CompanionDetailActions } from "@/components/CompanionDetailActions";
import { auth } from "@/lib/auth";
import {
  findCompanion,
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db";
import { getSiteName } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCompanionImageUrl, getCompanionUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companionId: string }>;
}): Promise<Metadata> {
  const { companionId } = await params;
  const uid = deslugify(companionId);
  const companion = await findCompanion(uid);
  if (!companion) return {};

  if (companionId !== slugify(companion)) {
    return permanentRedirect(getCompanionUrl(companion));
  }

  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const siteName = getSiteName(hostname);

  const creatorText = companion.creator
    ? ` by ${companion.creator.displayName}`
    : "";
  const companionInfo = [companion.kind, companion.class]
    .filter(Boolean)
    .join(" ");

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: companion.name,
    description: `${companion.name} - ${companionInfo}${creatorText} | ${siteName}`,
    openGraph: {
      title: companion.name,
      description: `${companionInfo}${creatorText}`,
      type: "article",
      url: getCompanionUrl(companion),
      images: [
        {
          url: `${getCompanionImageUrl(companion)}?${companion.updatedAt.getTime()}`,
          alt: companion.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: companion.name,
      description: `${companionInfo}${creatorText}`,
      images: [
        `${getCompanionImageUrl(companion)}?${companion.updatedAt.getTime()}`,
      ],
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

  const uid = deslugify(companionId);
  const companion = await findCompanion(uid);
  if (!companion) return notFound();

  if (companionId !== slugify(companion)) {
    return permanentRedirect(getCompanionUrl(companion));
  }

  const [officialConditions, userConditions] = await Promise.all([
    listOfficialConditions(),
    listConditionsForDiscordId(companion.creator.discordId || ""),
  ]);
  const _conditions = [...officialConditions, ...userConditions];

  // if companion is not public, then user must be creator
  const isOwner =
    session?.user?.discordId === companion.creator?.discordId || false;

  if (companion.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start mb-6">
        {isOwner && <CompanionDetailActions companion={companion} />}
      </div>
      <div className="max-w-2xl mx-auto">
        <Card companion={companion} creator={companion.creator} link={false} />
      </div>
    </div>
  );
}
