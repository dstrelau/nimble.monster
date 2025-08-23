import { notFound } from "next/navigation";
import { CardGrid } from "@/app/ui/companion/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MyCompanionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const companions = await db.listAllCompanionsForDiscordID(session.user.id);
  return (
    <div className="container mx-auto py-3">
      <CardGrid
        companions={companions}
        gridColumns={{ default: 1, md: 1, lg: 2 }}
      />
    </div>
  );
}
