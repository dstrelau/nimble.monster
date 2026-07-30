import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import BuildBackgroundView from "../BuildBackgroundView";

export default function NewBackgroundPage() {
  return (
    <HydratedBuilderData includeSources>
      <BuildBackgroundView />
    </HydratedBuilderData>
  );
}
