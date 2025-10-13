import type { Spell } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toSpell } from "./converters";
import { prisma } from "./index";

export const findSpell = async (id: string): Promise<Spell | null> => {
  if (!isValidUUID(id)) return null;

  const spell = await prisma.spell.findUnique({
    where: { id },
    include: {
      school: {
        include: {
          creator: true,
        },
      },
    },
  });
  return spell ? toSpell(spell) : null;
};

export const findPublicSpellById = async (
  id: string
): Promise<Spell | null> => {
  if (!isValidUUID(id)) return null;

  const spell = await prisma.spell.findUnique({
    where: {
      id,
      school: {
        visibility: "public",
      },
    },
    include: {
      school: {
        include: {
          creator: true,
        },
      },
    },
  });
  return spell ? toSpell(spell) : null;
};
