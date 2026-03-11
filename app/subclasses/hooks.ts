import { searchClassesForSubclass } from "@/app/actions/class";

export function subclassClassOptionsQueryOptions(search?: string) {
  return {
    queryKey: ["subclass-class-options", search ?? ""],
    queryFn: () => searchClassesForSubclass(search || undefined),
  };
}
