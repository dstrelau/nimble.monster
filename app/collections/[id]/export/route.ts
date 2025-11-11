import { trace } from "@opentelemetry/api";
import AdmZip from "adm-zip";
import { notFound, permanentRedirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import {
  itemToMarkdown,
  monsterToMarkdown,
  spellSchoolToMarkdown,
} from "@/lib/export/markdown";
import { telemetry } from "@/lib/telemetry";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getCollectionExportUrl } from "@/lib/utils/url";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function generateUniqueFilename(
  baseName: string,
  extension: string,
  existingNames: Set<string>
): string {
  let filename = `${sanitizeFilename(baseName)}.${extension}`;
  let counter = 1;

  while (existingNames.has(filename)) {
    filename = `${sanitizeFilename(baseName)}-${counter}.${extension}`;
    counter++;
  }

  existingNames.add(filename);
  return filename;
}

export const GET = telemetry(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id: collectionId } = await params;
    const span = trace.getActiveSpan();
    span?.setAttributes({ "params.id": collectionId });

    const uid = deslugify(collectionId);
    if (!uid) {
      return notFound();
    }

    const session = await auth();
    const collection = await db.getCollection(uid, session?.user?.discordId);

    if (!collection) {
      return notFound();
    }

    if (collectionId !== slugify(collection)) {
      return permanentRedirect(getCollectionExportUrl(collection));
    }

    if (
      collection.visibility === "private" &&
      collection.creator.discordId !== session?.user?.discordId
    ) {
      return notFound();
    }

    span?.setAttributes({ "collection.id": collection.id });

    const zip = new AdmZip();
    const existingFilenames = new Set<string>();

    for (const monster of collection.monsters) {
      const markdown = monsterToMarkdown(monster);
      const filename = generateUniqueFilename(
        monster.name,
        "md",
        existingFilenames
      );
      zip.addFile(filename, Buffer.from(markdown, "utf-8"));
    }

    for (const item of collection.items) {
      const markdown = itemToMarkdown(item);
      const filename = generateUniqueFilename(
        item.name,
        "md",
        existingFilenames
      );
      zip.addFile(filename, Buffer.from(markdown, "utf-8"));
    }

    for (const spellSchool of collection.spellSchools) {
      const markdown = spellSchoolToMarkdown(spellSchool);
      const filename = generateUniqueFilename(
        spellSchool.name,
        "md",
        existingFilenames
      );
      zip.addFile(filename, Buffer.from(markdown, "utf-8"));
    }

    const zipBuffer = zip.toBuffer();
    const zipFilename = `${sanitizeFilename(collection.name)}-export.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
      },
    });
  }
);
