import { User } from "@/lib/types";
import { prisma } from "./index";

export const getUserByUsername = async (
  username: string,
): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) return null;

  return {
    discordId: user.discordId,
    username: user.username,
    avatar: user.avatar || "",
  };
};

export const getUserPublicMonstersCount = async (
  username: string,
): Promise<number> => {
  return await prisma.monster.count({
    where: {
      creator: { username },
      visibility: "public",
    },
  });
};
