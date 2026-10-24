import { MONSTER_ROLES, type MonsterFormState } from "@/lib/services/monsters";

interface MonsterCardMetadataProps {
  monster: MonsterFormState;
}

export function MonsterCardMetadata({ monster }: MonsterCardMetadataProps) {
  const rows = [
    { label: "Type", value: monster.creatureTypes?.join(", ") },
    {
      label: "Kind",
      value: monster.creatureKinds
        ?.map((value) => value.replaceAll("-", " "))
        .join(", "),
    },
    { label: "Environment", value: monster.environments?.join(", ") },
    {
      label: "Role",
      value: MONSTER_ROLES.find((option) => option.value === monster.role)
        ?.label,
    },
  ].filter((row) => row.value);

  if (!rows.length) return null;

  return (
    <dl
      aria-label="Monster metadata"
      className="grid grid-cols-2 gap-x-4 gap-y-1 border-t px-4 pt-3 text-xs/4 text-muted-foreground"
    >
      {rows.map((row) => (
        <div key={row.label} className="min-w-0 wrap-anywhere">
          <dt className="inline font-medium after:content-[':']">
            {row.label}
          </dt>{" "}
          <dd className="inline">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
