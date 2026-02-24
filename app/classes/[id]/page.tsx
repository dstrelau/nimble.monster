import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ClassDetailView } from "@/app/ui/class/ClassDetailView";
import { ClassDetailActions } from "@/components/ClassDetailActions";
import { ClassSubclasses } from "@/components/ClassSubclasses";
import { auth } from "@/lib/auth";
import { findClass, listSubclassMinisForClass } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { getClassSlug, getClassUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const session = await auth();

  const classEntity = await findClass(uid);
  if (!classEntity) return {};
  const isOwner = session?.user?.id === classEntity.creator.id;
  if (classEntity.visibility !== "public" && !isOwner) {
    notFound();
  }

  if (id !== getClassSlug(classEntity)) {
    return permanentRedirect(getClassUrl(classEntity));
  }

  const creatorText = classEntity.creator
    ? ` by ${classEntity.creator.displayName}`
    : "";
  const title = classEntity.name;

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title,
    description: `${classEntity.name} - Class${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: title,
      description: `Class${creatorText}`,
      type: "article",
      url: getClassUrl(classEntity),
    },
    twitter: {
      card: "summary_large_image",
      title: classEntity.name,
      description: `Class${creatorText}`,
    },
  };
}

export default async function ClassPage({
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

  if (id !== getClassSlug(classEntity)) {
    return permanentRedirect(getClassUrl(classEntity));
  }

  const isOwner =
    session?.user?.discordId === classEntity.creator?.discordId || false;

  if (classEntity.visibility !== "public" && !isOwner) {
    return notFound();
  }

  const subclasses = (await listSubclassMinisForClass(classEntity.name)).sort(
    (a, b) => {
      const aMatch = a.creator.id === classEntity.creator.id ? 0 : 1;
      const bMatch = b.creator.id === classEntity.creator.id ? 0 : 1;
      return aMatch - bMatch;
    }
  );

  return (
    <div className="container mx-auto">
      {isOwner && (
        <div className="flex justify-end items-start gap-2 mb-6">
          <ClassDetailActions classEntity={classEntity} />
        </div>
      )}
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-12">
        <ClassDetailView
          classEntity={classEntity}
          creator={classEntity.creator}
        />
        <ClassSubclasses subclasses={subclasses} />
      </div>
    </div>
  );
}
