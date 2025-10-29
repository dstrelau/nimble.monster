import type { prisma } from "@/lib/db";
import { toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type {
  ClassAbilityItem,
  ClassAbilityList,
  ClassAbilityListMini,
  SubclassClass,
} from "@/lib/types";

export const toClassAbilityListMini = (
  list: Prisma.Result<typeof prisma.classAbilityList, object, "findMany">[0]
): ClassAbilityListMini => ({
  id: list.id,
  name: list.name,
  description: list.description,
  characterClass: list.characterClass
    ? (list.characterClass as SubclassClass)
    : undefined,
  createdAt: list.createdAt,
});

export const toClassAbilityList = (
  list: Prisma.Result<
    typeof prisma.classAbilityList,
    {
      include: {
        creator: true;
        items: true;
      };
    },
    "findMany"
  >[0]
): ClassAbilityList => {
  return {
    ...toClassAbilityListMini(list),
    updatedAt: list.updatedAt,
    creator: toUser(list.creator),
    items: list.items.map(
      (item): ClassAbilityItem => ({
        id: item.id,
        name: item.name,
        description: item.description,
      })
    ),
  };
};
