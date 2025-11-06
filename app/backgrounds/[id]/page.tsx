import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Card } from "@/app/ui/background/Card";
import { BackgroundDetailActions } from "@/components/BackgroundDetailActions";
import { auth } from "@/lib/auth";
import { findBackground } from "@/lib/services/backgrounds";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getBackgroundUrl } from "@/lib/utils/url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: backgroundId } = await params;
  const uid = deslugify(backgroundId);
  if (!uid) return {};
  const background = await findBackground(uid);

  if (!background) return {};

  if (backgroundId !== slugify(background)) {
    return permanentRedirect(getBackgroundUrl(background));
  }

  const creatorText = background.creator
    ? ` by ${background.creator.displayName}`
    : "";

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: background.name,
    description: `${background.name}${creatorText} | ${SITE_NAME}`,
    openGraph: {
      title: background.name,
      description: background.description,
      type: "article",
      url: getBackgroundUrl(background),
    },
    twitter: {
      card: "summary",
      title: background.name,
      description: background.description,
    },
  };
}

export default async function BackgroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: backgroundId } = await params;

  const uid = deslugify(backgroundId);
  if (!uid) return notFound();
  const background = await findBackground(uid);
  if (!background) return notFound();

  if (backgroundId !== slugify(background)) {
    return permanentRedirect(getBackgroundUrl(background));
  }

  const isOwner =
    session?.user?.discordId === background.creator?.discordId || false;

  return (
    <div>
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <BackgroundDetailActions background={background} />}
      </div>
      <div className="mx-auto flex flex-col items-center gap-12 max-w-md">
        <Card background={background} link={false} />
      </div>
    </div>
  );
}
