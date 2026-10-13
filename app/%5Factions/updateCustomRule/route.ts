import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { CustomRuleMutationResult } from "@/app/%5Factions/_customRule/contract";
import { updateCustomRuleSchema } from "@/app/%5Factions/_customRule/input";
import { auth } from "@/lib/auth";
import { type CustomRule, updateCustomRule } from "@/lib/db/custom-rule";
import { internalAction } from "@/lib/internal-action";

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
  const parsed = updateCustomRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttributes({
    "user.id": session.user.id,
    "customRule.id": parsed.data.id,
  });
  let rule: CustomRule;
  try {
    rule = await updateCustomRule({
      ...parsed.data.input,
      id: parsed.data.id,
      userId: session.user.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Custom rule not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Unknown rule(s): ")
    ) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
  revalidatePath("/custom-rules");
  revalidatePath(`/custom-rules/${rule.id}`);
  const result: CustomRuleMutationResult = { id: rule.id, name: rule.name };
  return NextResponse.json(result);
});
