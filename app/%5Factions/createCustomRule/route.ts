import { trace } from "@opentelemetry/api";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { CustomRuleMutationResult } from "@/app/%5Factions/_customRule/contract";
import { customRuleInputSchema } from "@/app/%5Factions/_customRule/input";
import { auth } from "@/lib/auth";
import { type CustomRule, createCustomRule } from "@/lib/db/custom-rule";
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
  const parsed = customRuleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  trace.getActiveSpan()?.setAttribute("user.id", session.user.id);
  let rule: CustomRule;
  try {
    rule = await createCustomRule({ ...parsed.data, userId: session.user.id });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unknown rule(s): ")
    ) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
  trace.getActiveSpan()?.setAttribute("customRule.id", rule.id);
  revalidatePath("/my/rules");
  revalidatePath("/rules/[slug]", "page");
  const result: CustomRuleMutationResult = { id: rule.id, name: rule.name };
  return NextResponse.json(result, { status: 201 });
});
