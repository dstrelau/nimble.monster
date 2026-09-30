import { notFound } from "next/navigation";
import { CardGrid } from "@/components/companion/CardGrid";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MyCompanionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const companions = await db.listAllCompanionsForDiscordID(
    session.user.discordId
  );

  if (companions.length === 0) {
    return <CreateEmptyState href="/companions/new" entityName="Companion" />;
  }

  return (
    <CardGrid
      companions={companions}
      gridColumns={{ default: 1, md: 1, lg: 2 }}
    />
  );
}
