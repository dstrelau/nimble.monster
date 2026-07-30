import type { Metadata } from "next";
import BuildClassView from "@/app/classes/BuildClassView";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `New Class | ${SITE_NAME}`,
  description: "Create a new class",
};

export default function NewClassPage() {
  return (
    <HydratedBuilderData>
      <BuildClassView />
    </HydratedBuilderData>
  );
}
