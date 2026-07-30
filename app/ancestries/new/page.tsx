import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import BuildAncestryView from "../BuildAncestryView";

export default function NewAncestryPage() {
  return (
    <HydratedBuilderData includeSources>
      <BuildAncestryView />
    </HydratedBuilderData>
  );
}
