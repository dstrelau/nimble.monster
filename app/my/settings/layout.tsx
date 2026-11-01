import { notFound } from "next/navigation";
import { SettingsSidebar } from "@/components/layout/SettingsSidebar";
import { auth } from "@/lib/auth";

export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <SettingsSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
