import { trace } from "@opentelemetry/api";
import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addMonsterToEncounter } from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import { encounters, monsters } from "@/lib/db/schema";
import {
  PUBLIC_ENCOUNTER_CONTENT_ERROR,
  UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
} from "@/lib/encounter-privacy";
import { internalAction } from "@/lib/internal-action";
import { isValidUUID } from "@/lib/utils/validation";

const countSchema = z
  .number()
  .default(1)
  .transform((value) => Math.max(1, value));
const inputSchema = z.object({
  monsterId: z.string().refine(isValidUUID, "Invalid monster ID"),
  encounterId: z.string().refine(isValidUUID, "Invalid encounter ID"),
  quantity: countSchema,
  isPerHero: z.boolean().default(false),
  heroesPerMonster: countSchema,
});

export const POST = internalAction("application/json", async (request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { monsterId, encounterId, heroesPerMonster } = parsed.data;
  trace.getActiveSpan()?.setAttributes({
    "encounter.id": encounterId,
    "monster.id": monsterId,
    "user.id": session.user.id,
  });
  const db = getDatabase();
  const ownedEncounter = await db
    .select({ id: encounters.id })
    .from(encounters)
    .where(
      and(
        eq(encounters.id, encounterId),
        eq(encounters.creatorId, session.user.id)
      )
    )
    .limit(1);
  if (ownedEncounter.length === 0) {
    return NextResponse.json(
      {
        error: "Encounter not found or you don't have permission to update it",
      },
      { status: 404 }
    );
  }
  const accessible = await db
    .select({ id: monsters.id, legendary: monsters.legendary })
    .from(monsters)
    .where(
      and(
        eq(monsters.id, monsterId),
        or(
          eq(monsters.visibility, "public"),
          eq(monsters.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await addMonsterToEncounter({
      monsterId,
      encounterId,
      quantity: accessible[0].legendary ? 1 : parsed.data.quantity,
      isPerHero: !accessible[0].legendary && parsed.data.isPerHero,
      heroesPerMonster,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        PUBLIC_ENCOUNTER_CONTENT_ERROR,
        UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
      ].includes(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
  revalidatePath("/my/encounters");
  revalidatePath("/encounters");
  revalidatePath("/encounters/[id]", "page");
  return NextResponse.json({ success: true });
});
