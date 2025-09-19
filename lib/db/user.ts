import type { User } from "@/lib/types";
import { toUser } from "./converters";
import { prisma } from "./index";

export const getUserByUsername = async (
  username: string
): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) return null;
  return toUser(user);
};

export const getUserPublicMonstersCount = async (
  username: string
): Promise<number> => {
  return await prisma.monster.count({
    where: {
      creator: { username },
      visibility: "public",
    },
  });
};
