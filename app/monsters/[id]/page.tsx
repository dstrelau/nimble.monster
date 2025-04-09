import * as db from "@/lib/db";
import { notFound } from "next/navigation";
import { MonsterCard } from "@/ui/MonsterCard";

export default async function MonsterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const monster = await db.findPublicMonsterById(params.id);

  if (!monster) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-screen-md">
      <MonsterCard monster={monster} showActions={false} />
    </div>
  );
}
