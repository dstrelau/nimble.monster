import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/subclass/Card";
import { SubclassDetailActions } from "@/components/SubclassDetailActions";
import { auth } from "@/lib/auth";
import { findSubclass } from "@/lib/db";

export const experimental_ppr = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const subclass = await findSubclass(id);

  if (!subclass) {
    return {
      title: "Subclass Not Found",
    };
  }

  const creatorText = subclass.creator
    ? ` by ${subclass.creator.displayName}`
    : "";
  const subclassInfo = `${subclass.className} Subclass`;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: subclass.name,
    description: `${subclass.name} - ${subclassInfo}${creatorText} | nimble.monster`,
    openGraph: {
      title: subclass.name,
      description: `${subclassInfo}${creatorText}`,
      type: "article",
      url: `/subclasses/${subclass.id}`,
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
  const subclass = await findSubclass(id);

  if (!subclass) {
    return notFound();
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
