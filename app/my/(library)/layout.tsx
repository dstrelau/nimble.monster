import { notFound } from "next/navigation";
import { MyLibrarySidebar } from "@/components/layout/MyLibrarySidebar";
import { auth } from "@/lib/auth";
import { getMyLibraryCounts } from "@/lib/db";

export default async function MyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const counts = await getMyLibraryCounts(session.user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <MyLibrarySidebar counts={counts} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
