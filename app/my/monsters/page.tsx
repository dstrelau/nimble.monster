import * as db from "@/lib/db";
import { CardGrid } from "@/ui/monster/CardGrid";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

export type MonsterDisplay = "card" | "list" | "table";

export default async function MyMonstersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const monsters = await db.listAllMonstersForDiscordID(session.user.id);
  return (
    <div className="container mx-auto py-6">
      <CardGrid monsters={monsters} currentUserId={session.user.id} />
    </div>
  );
}
