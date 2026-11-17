import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getFeaturedMembership,
  MONSTERY_MONDAY,
} from "@/lib/services/collections/queries";
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
        monsteryMonday={
          (await hasPermission(session.user.id, "monstery-monday"))
            ? await getFeaturedMembership(undefined, MONSTERY_MONDAY)
            : undefined
        }
      />
    </HydratedCollectionEditor>
  );
}
