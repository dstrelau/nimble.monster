import { unauthorized } from "next/navigation";
import { loadOfficialConditions } from "@/app/actions/conditions";
import BuildItemView from "@/app/ui/BuildItemView";
import { auth } from "@/lib/auth";
import { findItemWithCreatorDiscordId } from "@/lib/db/item";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const item = await findItemWithCreatorDiscordId(id, session?.user.id);
  const conditions = await loadOfficialConditions();

  if (!item) {
    return <div>Item not found</div>;
  }

  return <BuildItemView item={item} conditions={conditions} />;
}
