import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewCollection } from "./NewCollectionClient";

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/create");
  }

  return <NewCollection />;
}
