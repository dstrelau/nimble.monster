import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConditionsLibrary } from "@/components/condition/ConditionsLibrary";
import { auth } from "@/lib/auth";
import { listLibraryConditions } from "@/lib/db/condition";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = { title: `My Conditions - ${SITE_NAME}` };

export default async function MyConditionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const conditions = await listLibraryConditions(session.user.id);
  return <ConditionsLibrary conditions={conditions} />;
}
