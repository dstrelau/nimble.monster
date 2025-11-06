import { redirect } from "next/navigation";
import { MySpellsView } from "@/app/ui/school/MySpellsView";
import { auth } from "@/lib/auth";
import { listAllSpellSchoolsForDiscordID } from "@/lib/db/school";

export default async function MySpellsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const spellSchools = await listAllSpellSchoolsForDiscordID(
    session.user.discordId
  );

  return <MySpellsView spellSchools={spellSchools} />;
}
