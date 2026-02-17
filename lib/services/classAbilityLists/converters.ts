import { toUser } from "@/lib/db/converters";
import type {
  ClassAbilityItemRow,
  ClassAbilityListRow,
  UserRow,
} from "@/lib/db/schema";
import type {
  ClassAbilityItem,
  ClassAbilityList,
  ClassAbilityListMini,
  SubclassClass,
} from "@/lib/types";

export const toClassAbilityListMini = (
  list: ClassAbilityListRow
): ClassAbilityListMini => ({
  id: list.id,
  name: list.name,
  description: list.description,
  characterClass: list.characterClass
    ? (list.characterClass as SubclassClass)
    : undefined,
  createdAt: list.createdAt ? new Date(list.createdAt) : new Date(),
});

export const toClassAbilityList = (
  list: ClassAbilityListRow,
  creator: UserRow,
  items: ClassAbilityItemRow[]
): ClassAbilityList => ({
  ...toClassAbilityListMini(list),
  updatedAt: list.updatedAt ? new Date(list.updatedAt) : new Date(),
  creator: toUser(creator),
  items: items.map(
    (item): ClassAbilityItem => ({
      id: item.id,
      name: item.name,
      description: item.description,
    })
  ),
});
