import { notFound } from "next/navigation";
import { AdventureList } from "@/components/adventure/AdventureList";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { listAdventuresForUser } from "@/lib/db";

export default async function MyAdventuresPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const adventures = await listAdventuresForUser(session.user.id);
  if (adventures.length === 0) {
    return <CreateEmptyState href="/adventures/new" entityName="Adventure" />;
  }
  return <AdventureList adventures={adventures} />;
}
