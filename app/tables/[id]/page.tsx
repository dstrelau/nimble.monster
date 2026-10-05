import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { RandomTableHeader } from "@/app/tables/RandomTableHeader";
import { SubtablesView } from "@/components/random-table/SubtablesView";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId, listOfficialConditions } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getRandomTableUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const randomTable = await db.getRandomTable(uid);
  if (!randomTable) return {};

  if (id !== slugify(randomTable)) {
    return permanentRedirect(getRandomTableUrl(randomTable));
  }

  const creatorText = randomTable.creator?.displayName
    ? ` by ${randomTable.creator.displayName}`
    : "";
  const tableCount = randomTable.subtables.length;
  const countText = `${tableCount} table${tableCount !== 1 ? "s" : ""}`;
  const description = `${countText}${creatorText}`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: randomTable.name,
    description: `${randomTable.name} - ${description} | ${SITE_NAME}`,
    openGraph: {
      title: randomTable.name,
      description,
      type: "article",
      url: getRandomTableUrl(randomTable),
    },
    twitter: {
      card: "summary",
      title: randomTable.name,
      description,
    },
  };
}

export default async function ShowRandomTableView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const uid = deslugify(id);
  if (!uid) return notFound();
  const randomTable = await db.getRandomTable(uid, session?.user?.discordId);
  if (!randomTable) return notFound();

  if (id !== slugify(randomTable)) {
    return permanentRedirect(getRandomTableUrl(randomTable));
  }

  if (
    randomTable.visibility === "private" &&
    randomTable.creator.discordId !== session?.user.discordId
  ) {
    notFound();
  }

  const [officialConditions, userConditions] = await Promise.all([
    listOfficialConditions(),
    listConditionsForDiscordId(randomTable.creator.discordId),
  ]);
  const conditions = [...officialConditions, ...userConditions];

  const isCreator = session?.user?.discordId === randomTable.creator.discordId;

  return (
    <div>
      <RandomTableHeader
        randomTable={randomTable}
        showEditDeleteButtons={isCreator}
        conditions={conditions}
      />

      {randomTable.subtables.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          This table is empty.
        </p>
      ) : (
        <SubtablesView
          subtables={randomTable.subtables}
          conditions={conditions}
        />
      )}
    </div>
  );
}
