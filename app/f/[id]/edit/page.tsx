import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { EditFamilyClient } from "./EditFamilyClient";

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [family, session] = await Promise.all([
    db.getFamily(id),
    auth(),
  ]);

  if (!family) {
    notFound();
  }

  if (!session?.user?.id || session.user.id !== family.creatorId) {
    redirect(`/f/${id}`);
  }

  return <EditFamilyClient family={family} />;
}
