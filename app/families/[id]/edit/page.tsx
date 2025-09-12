import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { CreateEditFamily } from "../../CreateEditFamily";

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [family, session] = await Promise.all([db.getFamily(id), auth()]);

  if (!family) {
    notFound();
  }

  if (!session?.user?.id || session.user.discordId !== family.creatorId) {
    redirect(`/families/${id}`);
  }

  return <CreateEditFamily family={family} />;
}
