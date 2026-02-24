import { notFound } from "next/navigation";
import { findClassAbilityList } from "@/app/actions/classAbilityList";
import { auth } from "@/lib/auth";
import { deslugify } from "@/lib/utils/slug";
import BuildClassAbilityListView from "../../BuildClassAbilityListView";

export default async function EditClassAbilityListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();
  const result = await findClassAbilityList(uid);

  if (!result.success || !result.list) {
    notFound();
  }

  const isOwner =
    session?.user?.discordId === result.list.creator?.discordId || false;

  if (!isOwner) {
    return notFound();
  }

  return <BuildClassAbilityListView list={result.list} />;
}
