import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminJsonAction } from "@/lib/admin-action";
import * as awardDb from "@/lib/db/award";
import type { AwardEntityType } from "../_award/contract";
import { awardAssociationSchema } from "../_award/input";

const removeAward: Record<
  AwardEntityType,
  (awardId: string, entityId: string) => Promise<void>
> = {
  monster: awardDb.removeAwardFromMonster,
  item: awardDb.removeAwardFromItem,
  companion: awardDb.removeAwardFromCompanion,
  subclass: awardDb.removeAwardFromSubclass,
  school: awardDb.removeAwardFromSchool,
  ancestry: awardDb.removeAwardFromAncestry,
  background: awardDb.removeAwardFromBackground,
};

export const POST = adminJsonAction(
  awardAssociationSchema,
  async ({ entityType, entityId, awardId }) => {
    await removeAward[entityType](awardId, entityId);
    revalidatePath("/admin/awards");
    return NextResponse.json({ success: true });
  }
);
