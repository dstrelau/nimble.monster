import { notFound } from "next/navigation";
import { PaginatedBackgroundGrid } from "@/app/ui/background/PaginatedBackgroundGrid";
import { auth } from "@/lib/auth";

export default async function MyBackgroundsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  return <PaginatedBackgroundGrid kind="my-backgrounds" />;
}
