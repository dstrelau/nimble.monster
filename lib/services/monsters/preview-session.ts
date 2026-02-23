import type { JSONAPIFamily, JSONAPIMonster } from "@/lib/api/monsters";
import {
  deletePreviewSession as deleteGeneric,
  readPreviewSession as readGeneric,
  writePreviewSession as writeGeneric,
} from "@/lib/services/preview-session";
import type { OfficialSource } from "@/lib/services/validate-source";

export interface PreviewSessionData {
  monsters: JSONAPIMonster[];
  families: [string, JSONAPIFamily][];
  source?: OfficialSource;
}

export async function writePreviewSession(
  sessionKey: string,
  data: {
    monsters: JSONAPIMonster[];
    families: Map<string, JSONAPIFamily>;
    source?: OfficialSource;
  }
): Promise<void> {
  await writeGeneric<PreviewSessionData>("monsters", sessionKey, {
    monsters: data.monsters,
    families: Array.from(data.families.entries()),
    source: data.source,
  });
}

export async function readPreviewSession(
  sessionKey: string
): Promise<PreviewSessionData | null> {
  return readGeneric<PreviewSessionData>("monsters", sessionKey);
}

export async function deletePreviewSession(sessionKey: string): Promise<void> {
  await deleteGeneric("monsters", sessionKey);
}
