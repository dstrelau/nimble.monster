"use server";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";

export const signInAction = async () => {
  const headersList = await headers();
  const referer = headersList.get("referer") || "/";
  await signIn("discord", { redirectTo: referer });
};
