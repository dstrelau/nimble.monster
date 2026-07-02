import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewEncounter } from "./NewEncounterClient";

export default async function NewEncounterPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/create");
  }

  return <NewEncounter />;
}
