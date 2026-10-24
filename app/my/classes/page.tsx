import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClassesListView } from "@/components/class/ClassesListView";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { listAllClassesForDiscordID } from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `My Classes | ${SITE_NAME}`,
  description: "Manage your classes",
};

export default async function MyClassesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const classes = await listAllClassesForDiscordID(session.user.discordId);

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.class}
        title="My Classes"
        newHref="/classes/new"
        newLabel="New Class"
      />
      {classes.length === 0 ? (
        <EmptyState entityName="classes" />
      ) : (
        <ClassesListView classes={classes} />
      )}
    </div>
  );
}
