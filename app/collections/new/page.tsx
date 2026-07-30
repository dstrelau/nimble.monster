import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HydratedCollectionEditor } from "../HydratedCollectionEditor";
import { NewCollection } from "./NewCollectionClient";

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/create");
  }

  return (
    <HydratedCollectionEditor>
      <NewCollection />
    </HydratedCollectionEditor>
  );
}
