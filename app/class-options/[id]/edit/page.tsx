import { notFound } from "next/navigation";
import { findClassAbilityList } from "@/app/actions/classAbilityList";
import { deslugify } from "@/lib/utils/slug";
import BuildClassAbilityListView from "../../BuildClassAbilityListView";

export default async function EditClassAbilityListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();
  const result = await findClassAbilityList(uid);

  if (!result.success || !result.list) {
    notFound();
  }

  return <BuildClassAbilityListView list={result.list} />;
}
