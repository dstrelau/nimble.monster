import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/services/permissions";
import { HydratedCollectionEditor } from "../HydratedCollectionEditor";
import { NewCollection } from "./NewCollectionClient";

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/collections/new");
  }

  return (
    <HydratedCollectionEditor>
      <NewCollection
        canMarkMonsteryMonday={
          await hasPermission(session.user.id, "monstery-monday")
        }
      />
    </HydratedCollectionEditor>
  );
}
