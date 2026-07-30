import { listPublicClassesAction } from "@/app/actions/class";
import { listPublicSubclassesAction } from "@/app/actions/subclass";
import { listPublicSpellSchoolsAction } from "@/app/spell-schools/actions";

export function publicClassesQueryOptions() {
  return {
    queryKey: ["classes-all"],
    queryFn: listPublicClassesAction,
    staleTime: 30000,
  };
}

export function publicSubclassesQueryOptions() {
  return {
    queryKey: ["subclasses-all"],
    queryFn: listPublicSubclassesAction,
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
