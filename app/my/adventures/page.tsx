import { notFound } from "next/navigation";
import { AdventureList } from "@/components/adventure/AdventureList";
import { auth } from "@/lib/auth";
import { listAdventuresForUser } from "@/lib/db";

export default async function MyAdventuresPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const adventures = await listAdventuresForUser(session.user.id);
  return <AdventureList adventures={adventures} />;
}
