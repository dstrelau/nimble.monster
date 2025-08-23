import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/companion/Card";
import { auth } from "@/lib/auth";
import { findCompanion } from "@/lib/db";

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

  const creatorText = companion.creator ? ` by ${companion.creator.username}` : "";
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
  const rawCompanion = await findCompanion(companionId);

  if (!rawCompanion) {
    return notFound();
  }

  // if companion is not public, then user must be creator
  const isOwner = session?.user?.id === rawCompanion.creator?.discordId || false;

  if (rawCompanion.visibility !== "public" && !isOwner) {
    return notFound();
  }

  const companion = JSON.parse(JSON.stringify(rawCompanion)); // Force serialization

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start mb-6">
        {/* TODO: Add CompanionDetailActions component if needed */}
      </div>
      <div className="max-w-2xl mx-auto">
        <Card
          companion={companion}
          creator={companion.creator}
          link={false}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}