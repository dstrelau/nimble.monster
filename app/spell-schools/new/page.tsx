import BuildSchoolView from "@/app/spell-schools/BuildSchoolView";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";

export default async function NewSchoolPage() {
  return (
    <HydratedBuilderData>
      <BuildSchoolView />
    </HydratedBuilderData>
  );
}
