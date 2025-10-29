import { notFound } from "next/navigation";
import { findClassAbilityList } from "@/app/actions/classAbilityList";
import { AbilityListCard } from "@/app/ui/class-options/AbilityListCard";
import { ClassAbilityListDetailActions } from "@/components/ClassAbilityListDetailActions";
import { auth } from "@/lib/auth";
import { deslugify } from "@/lib/utils/slug";

export default async function ClassAbilityListPage({
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

  return (
    <div className="container mx-auto">
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <ClassAbilityListDetailActions abilityList={result.list} />}
      </div>
      <AbilityListCard abilityList={result.list} />
    </div>
  );
}
