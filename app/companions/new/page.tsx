import BuildCompanionView from "@/app/companions/BuildCompanionView";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";

export default function NewCompanionPage() {
  return (
    <HydratedBuilderData>
      <BuildCompanionView />
    </HydratedBuilderData>
  );
}
