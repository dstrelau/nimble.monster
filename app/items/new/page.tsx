import { loadOfficialConditions } from "@/app/actions/conditions";
import BuildItemView from "@/app/ui/BuildItemView";

export default async function NewItemPage() {
  const conditions = await loadOfficialConditions();
  return <BuildItemView conditions={conditions} />;
}
