import type { Metadata } from "next";
import { ClassesListView } from "@/app/ui/class/ClassesListView";
import { listPublicClasses } from "@/lib/db";
import { isOfficialOnlyDomain } from "@/lib/domain";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `Classes | ${SITE_NAME}`,
  description: "Browse all public classes",
};

export default async function ClassesPage() {
  const officialOnly = await isOfficialOnlyDomain();
  const classes = await listPublicClasses(officialOnly);
  return <ClassesListView classes={classes} />;
}
