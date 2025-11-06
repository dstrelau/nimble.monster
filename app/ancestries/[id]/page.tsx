import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Card } from "@/app/ui/ancestry/Card";
import { AncestryDetailActions } from "@/components/AncestryDetailActions";
import { auth } from "@/lib/auth";
import { findAncestry } from "@/lib/services/ancestries";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getAncestryUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: ancestryId } = await params;
  const uid = deslugify(ancestryId);
  if (!uid) return {};
  const ancestry = await findAncestry(uid);

  if (!ancestry) return {};

  if (ancestryId !== slugify(ancestry)) {
    return permanentRedirect(getAncestryUrl(ancestry));
  }

  const creatorText = ancestry.creator
    ? ` by ${ancestry.creator.displayName}`
    : "";

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: ancestry.name,
    description: `${ancestry.name}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: ancestry.name,
      description: ancestry.description,
      type: "article",
      url: getAncestryUrl(ancestry),
    },
    twitter: {
      card: "summary",
      title: ancestry.name,
      description: ancestry.description,
    },
  };
}

export default async function AncestryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: ancestryId } = await params;

  const uid = deslugify(ancestryId);
  if (!uid) return notFound();
  const ancestry = await findAncestry(uid);
  if (!ancestry) return notFound();

  if (ancestryId !== slugify(ancestry)) {
    return permanentRedirect(getAncestryUrl(ancestry));
  }

  const isOwner =
    session?.user?.discordId === ancestry.creator?.discordId || false;

  return (
    <div>
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <AncestryDetailActions ancestry={ancestry} />}
      </div>
      <div className="mx-auto flex flex-col items-center gap-12 max-w-md">
        <Card ancestry={ancestry} link={false} />
      </div>
    </div>
  );
}
