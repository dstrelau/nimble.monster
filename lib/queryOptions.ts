import { listPublicClasses } from "@/app/%5Factions/listPublicClasses/contract";
import { listPublicSubclasses } from "@/app/%5Factions/listPublicSubclasses/contract";
import { listPublicSpellSchoolsAction } from "@/app/spell-schools/actions";
import { call } from "@/lib/contract";
import type { Class, Subclass } from "@/lib/types";

export function publicClassesQueryOptions() {
  return {
    queryKey: ["classes-all"],
    queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<Class[]> => {
      const classes = await call(listPublicClasses, undefined, { signal });
      return classes.map((classEntity) => ({
        ...classEntity,
        createdAt: new Date(classEntity.createdAt),
        updatedAt: new Date(classEntity.updatedAt),
        source: classEntity.source
          ? {
              ...classEntity.source,
              createdAt: new Date(classEntity.source.createdAt),
              updatedAt: new Date(classEntity.source.updatedAt),
            }
          : undefined,
        awards: classEntity.awards?.map((award) => ({
          ...award,
          createdAt: new Date(award.createdAt),
          updatedAt: new Date(award.updatedAt),
        })),
        abilityLists: classEntity.abilityLists.map((list) => ({
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
        })),
      }));
    },
    staleTime: 30000,
  };
}

export function publicSubclassesQueryOptions() {
  return {
    queryKey: ["subclasses-all"],
    queryFn: async ({
      signal,
    }: {
      signal?: AbortSignal;
    }): Promise<Subclass[]> => {
      const subclasses = await call(listPublicSubclasses, undefined, {
        signal,
      });
      return subclasses.map((subclass) => ({
        ...subclass,
        createdAt: new Date(subclass.createdAt),
        updatedAt: new Date(subclass.updatedAt),
        source: subclass.source
          ? {
              ...subclass.source,
              createdAt: new Date(subclass.source.createdAt),
              updatedAt: new Date(subclass.source.updatedAt),
            }
          : undefined,
        awards: subclass.awards?.map((award) => ({
          ...award,
          createdAt: new Date(award.createdAt),
          updatedAt: new Date(award.updatedAt),
        })),
        abilityLists: subclass.abilityLists.map((list) => ({
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
        })),
      }));
    },
    staleTime: 30000,
  };
}

export function publicSpellSchoolsQueryOptions() {
  return {
    queryKey: ["spellSchools-all"],
    queryFn: listPublicSpellSchoolsAction,
    staleTime: 30000,
  };
}
