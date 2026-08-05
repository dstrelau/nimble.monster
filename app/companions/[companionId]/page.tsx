import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CompanionDetailActions } from "@/app/companions/CompanionDetailActions";
import { AddToCollectionDialog } from "@/components/collection/AddToCollectionDialog";
import { Card } from "@/components/companion/Card";
import { DetailActionBar } from "@/components/DetailActionBar";
import { HydratedEntityDetail } from "@/components/HydratedEntityDetail";
import { auth } from "@/lib/auth";
import {
  findCompanion,
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCompanionImageUrl, getCompanionUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companionId: string }>;
}): Promise<Metadata> {
  const { companionId } = await params;
  const uid = deslugify(companionId);
  if (!uid) return {};
  const companion = await findCompanion(uid);
  if (!companion) return {};

  if (companionId !== slugify(companion)) {
    return permanentRedirect(getCompanionUrl(companion));
  }

  const creatorText = companion.creator
    ? ` by ${companion.creator.displayName}`
    : "";
  const companionInfo = [companion.kind, companion.class]
    .filter(Boolean)
    .join(" ");

  return {
    title: companion.name,
    description: `${companion.name} - ${companionInfo}${creatorText} | ${SITE_NAME}`,
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
  if (!uid) return notFound();
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
    <HydratedEntityDetail
      authenticated={Boolean(session?.user?.id)}
      entityType="companion"
      entityId={companion.id}
      creatorDiscordId={companion.creator?.discordId}
      viewerDiscordId={session?.user?.discordId}
    >
      <div>
        <DetailActionBar>
          {session?.user && (
            <AddToCollectionDialog
              type="companion"
              companionId={companion.id}
            />
          )}
          {session?.user && (
            <CompanionDetailActions companion={companion} isOwner={isOwner} />
          )}
        </DetailActionBar>
        <div className="max-w-3xl mx-auto">
          <Card
            companion={companion}
            creator={companion.creator}
            link={false}
          />
        </div>
      </div>
    </HydratedEntityDetail>
  );
}
