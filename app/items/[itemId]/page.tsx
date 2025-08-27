import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadOfficialConditions } from "@/app/actions/conditions";
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
  const item = await findItem(itemId);
  const conditions = await loadOfficialConditions();

  if (!item) {
    return notFound();
  }

  // if item is not public, then user must be creator
  const isOwner = session?.user?.id === item.creator?.discordId || false;

  if (item.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start mb-6">
        {isOwner && <ItemDetailActions item={item} />}
      </div>
      <div className="flex justify-center">
        <Card
          item={item}
          creator={item.creator}
          link={false}
          isOwner={isOwner}
          conditions={conditions}
        />
      </div>
    </div>
  );
}
