import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClassesListView } from "@/components/class/ClassesListView";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listAllClassesForDiscordID } from "@/lib/db";
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Classes</h1>
        <Button asChild>
          <Link href="/classes/new">Create New Class</Link>
        </Button>
      </div>
      {classes.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          You haven't created any classes yet.
        </p>
      ) : (
        <ClassesListView classes={classes} />
      )}
    </div>
  );
}
