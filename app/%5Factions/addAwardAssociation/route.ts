import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { adminJsonAction, isSqliteConstraint } from "@/lib/admin-action";
import * as awardDb from "@/lib/db/award";
import type { AwardEntityType } from "../_award/contract";
import { awardAssociationSchema } from "../_award/input";

const addAward: Record<
  AwardEntityType,
  (awardId: string, entityId: string) => Promise<void>
> = {
  monster: awardDb.addAwardToMonster,
  item: awardDb.addAwardToItem,
  companion: awardDb.addAwardToCompanion,
  subclass: awardDb.addAwardToSubclass,
  school: awardDb.addAwardToSchool,
  ancestry: awardDb.addAwardToAncestry,
  background: awardDb.addAwardToBackground,
};

export const POST = adminJsonAction(
  awardAssociationSchema,
  async ({ entityType, entityId, awardId }) => {
    try {
      await addAward[entityType](awardId, entityId);
    } catch (error) {
      if (isSqliteConstraint(error, "SQLITE_CONSTRAINT_FOREIGNKEY")) {
        return NextResponse.json(
          { error: "Award or entity not found" },
          { status: 404 }
        );
      }
      throw error;
    }
    revalidatePath("/admin/awards");
    return NextResponse.json({ success: true });
  }
);
