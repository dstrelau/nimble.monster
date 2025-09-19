import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/app/ui/item/Card";
import { ItemCollections } from "@/components/ItemCollections";
import { ItemDetailActions } from "@/components/ItemDetailActions";
import { auth } from "@/lib/auth";
import { findItem, findItemCollections } from "@/lib/db";

export const experimental_ppr = true;

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

  const creatorText = item.creator ? ` by ${item.creator.displayName}` : "";
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
      images: [
        {
          url: `/items/${item.id}/image`,
          alt: item.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: item.name,
      description: `${itemInfo}${creatorText}`,
      images: [`/items/${item.id}/image`],
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
  const [item, collections] = await Promise.all([
    findItem(itemId),
    findItemCollections(itemId),
  ]);

  if (!item) {
    return notFound();
  }

  // if item is not public, then user must be creator
  const isOwner = session?.user?.discordId === item.creator?.discordId || false;

  if (item.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start mb-6">
        {isOwner && <ItemDetailActions item={item} />}
      </div>
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-12">
          <Card item={item} creator={item.creator} link={false} />
          <ItemCollections collections={collections} />
        </div>
      </div>
    </div>
  );
}
