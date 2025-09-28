import { notFound, permanentRedirect, unauthorized } from "next/navigation";
import BuildItemView from "@/app/items/BuildItemView";
import { auth } from "@/lib/auth";
import { findItemWithCreatorDiscordId as findItemWithCreatorId } from "@/lib/db/item";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getItemEditUrl } from "@/lib/utils/url";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const uid = deslugify(itemId);
  const item = await findItemWithCreatorId(uid, session?.user.id);
  if (!item) return notFound();

  if (itemId !== slugify(item)) {
    return permanentRedirect(getItemEditUrl(item));
  }

  return <BuildItemView item={item} />;
}
