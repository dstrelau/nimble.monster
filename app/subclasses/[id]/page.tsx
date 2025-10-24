import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Card } from "@/app/ui/subclass/Card";
import { SubclassDetailActions } from "@/components/SubclassDetailActions";
import { auth } from "@/lib/auth";
import { findSubclass } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { getSubclassSlug, getSubclassUrl } from "@/lib/utils/url";

export const experimental_ppr = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const session = await auth();

  const subclass = await findSubclass(uid);
  if (!subclass) return {};
  const isOwner = session?.user?.id === subclass.creator.id;
  if (subclass.visibility !== "public" && !isOwner) {
    notFound();
  }

  if (id !== getSubclassSlug(subclass)) {
    return permanentRedirect(getSubclassUrl(subclass));
  }

  const creatorText = subclass.creator
    ? ` by ${subclass.creator.displayName}`
    : "";
  const subclassInfo = `${subclass.className} Subclass`;
  const title = `${subclass.namePreface} ${subclass.name}`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title,
    description: `${subclass.name} - ${subclassInfo}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: title,
      description: `${subclassInfo}${creatorText}`,
      type: "article",
      url: getSubclassUrl(subclass),
    },
    twitter: {
      card: "summary_large_image",
      title: subclass.name,
      description: `${subclassInfo}${creatorText}`,
    },
  };
}

export default async function SubclassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const uid = deslugify(id);
  if (!uid) return notFound();
  const subclass = await findSubclass(uid);
  if (!subclass) return notFound();

  if (id !== getSubclassSlug(subclass)) {
    return permanentRedirect(getSubclassUrl(subclass));
  }

  // if subclass is not public, then user must be creator
  const isOwner =
    session?.user?.discordId === subclass.creator?.discordId || false;

  if (subclass.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <SubclassDetailActions subclass={subclass} />}
      </div>
      <div className="max-w-2xl mx-auto">
        <Card
          className="w-full"
          subclass={subclass}
          creator={subclass.creator}
          link={false}
        />
      </div>
    </div>
  );
}
