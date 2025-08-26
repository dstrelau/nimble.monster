import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/item/Card";
import { ItemDetailActions } from "@/components/ItemDetailActions";
import { auth } from "@/lib/auth";
import { findItem } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemId: string }>;
}): Promise<Metadata> {
  const { itemId } = await params;
  const item = await findItem(itemId);

  if (!item) {
    return {
      title: "Item Not Found",
    };
  }

  const creatorText = item.creator ? ` by ${item.creator.username}` : "";
  const itemInfo = item.kind || "Item";

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: item.name,
    description: `${item.name} - ${itemInfo}${creatorText} | nimble.monster`,
    openGraph: {
      title: item.name,
      description: `${itemInfo}${creatorText}`,
      type: "article",
      url: `/items/${item.id}`,
    },
    twitter: {
      card: "summary",
      title: item.name,
      description: `${itemInfo}${creatorText}`,
    },
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const session = await auth();
  const { itemId } = await params;
  const rawItem = await findItem(itemId);

  if (!rawItem) {
    return notFound();
  }

  // if item is not public, then user must be creator
  const isOwner = session?.user?.id === rawItem.creator?.discordId || false;

  if (rawItem.visibility !== "public" && !isOwner) {
    return notFound();
  }

  const item = JSON.parse(JSON.stringify(rawItem)); // Force serialization

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start mb-6">
        {isOwner && <ItemDetailActions item={item} />}
      </div>
      <div className="max-w-2xl mx-auto">
        <Card
          item={item}
          creator={item.creator}
          link={false}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
