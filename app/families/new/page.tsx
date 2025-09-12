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
    creator: session.user,
  };

  return <CreateEditFamily family={emptyFamily} isCreating={true} />;
}
