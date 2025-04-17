import { notFound } from "next/navigation";
import { EditForm } from "./EditForm";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  if (!id) return notFound();

  const session = await auth();
  if (!session?.user?.id) return notFound();

  const [collection, myMonsters] = await Promise.all([
    db.getCollection(id),
    db.listAllMonstersForDiscordID(session.user.id),
  ]);

  if (!collection) return notFound();

  return (
    <div className="">
      <EditForm collection={collection} myMonsters={myMonsters} />
    </div>
  );
}
