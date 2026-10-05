import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewRandomTable } from "./NewRandomTableClient";

export default async function NewRandomTablePage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  return <NewRandomTable />;
}
