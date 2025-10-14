import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Card } from "@/app/ui/item/Card";
import { AddToCollectionDialog } from "@/components/AddToCollectionDialog";
import { ItemCollections } from "@/components/ItemCollections";
import { ItemDetailActions } from "@/components/ItemDetailActions";
import { auth } from "@/lib/auth";
import { itemsService } from "@/lib/services/items";
import { getSiteName } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getItemImageUrl, getItemUrl } from "@/lib/utils/url";

export const experimental_ppr = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemId: string }>;
}): Promise<Metadata> {
  const { itemId } = await params;
  const uid = deslugify(itemId);
  const item = await itemsService.getItem(uid);
  if (!item) return {};

  if (itemId !== slugify(item)) {
    return permanentRedirect(getItemUrl(item));
  }

  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const siteName = getSiteName(hostname);

  const creatorText = item.creator ? ` by ${item.creator.displayName}` : "";
  const itemInfo = item.kind || "Item";

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: item.name,
    description: `${item.name} - ${itemInfo}${creatorText} | ${siteName}`,
    openGraph: {
      title: item.name,
      description: `${itemInfo}${creatorText}`,
      type: "article",
      url: getItemUrl(item),
      images: [
        {
          url: `${getItemImageUrl(item)}?${item.updatedAt.getTime()}`,
          alt: item.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: item.name,
      description: `${itemInfo}${creatorText}`,
      images: [`${getItemImageUrl(item)}?${item.updatedAt.getTime()}`],
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

  const uid = deslugify(itemId);
  const item = await itemsService.getItem(uid);
  if (!item) return notFound();

  if (itemId !== slugify(item)) {
    return permanentRedirect(getItemUrl(item));
  }

  const collections = await itemsService.getItemCollections(uid);

  // if item is not public, then user must be creator
  const isOwner = session?.user?.discordId === item.creator?.discordId || false;

  if (item.visibility !== "public" && !isOwner) {
    return notFound();
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <ItemDetailActions item={item} />}
        {session?.user && (
          <AddToCollectionDialog type="item" itemId={item.id} />
        )}
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
