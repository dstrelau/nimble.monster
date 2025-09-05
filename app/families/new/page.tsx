import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { FamilyOverview } from "@/lib/types";
import { CreateEditFamily } from "../CreateEditFamily";

export default async function NewFamilyPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const emptyFamily: FamilyOverview = {
    id: "",
    name: "",
    description: "",
    abilities: [],
    creatorId: "",
    creator: {
      discordId: session.user.id,
      username: session.user.name || "",
      avatar: session.user.image || "",
    },
  };

  return <CreateEditFamily family={emptyFamily} isCreating={true} />;
}
