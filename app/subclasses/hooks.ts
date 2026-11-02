import { searchClassesForSubclass } from "@/app/%5Factions/searchClassesForSubclass/contract";
import { call } from "@/lib/contract";

export function subclassClassOptionsQueryOptions(
  search?: string,
  userId?: string
) {
  return {
    queryKey: ["subclass-class-options", userId, search ?? ""],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(
        searchClassesForSubclass,
        { searchTerm: search || undefined },
        { signal }
      ),
  };
}
