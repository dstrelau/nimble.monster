import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";
import { NewRandomTable } from "./NewRandomTableClient";

export default async function NewRandomTablePage() {
  const session = await auth();

  if (
    !session?.user?.id ||
    !(await isFeatureFlagEnabled(session.user.id, "random-tables"))
  ) {
    notFound();
  }

  return <NewRandomTable />;
}
