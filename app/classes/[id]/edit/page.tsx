import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BuildClassView from "@/app/classes/BuildClassView";
import { auth } from "@/lib/auth";
import { findClass } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";

export const metadata: Metadata = {
  title: `Edit Class | ${SITE_NAME}`,
  description: "Edit class",
};

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const uid = deslugify(id);
  if (!uid) return notFound();

  const classEntity = await findClass(uid);
  if (!classEntity) return notFound();

  const isOwner =
    session?.user?.discordId === classEntity.creator?.discordId || false;

  if (!isOwner) {
    return notFound();
  }

  return <BuildClassView classEntity={classEntity} />;
}
