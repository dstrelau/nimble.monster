import type { Ability, Action } from "@/lib/types";
import type { MonsterArmor, MonsterSize, MonsterTeamMember } from "./types";

// Shape of a team member as persisted in the `monsters.members` JSON column.
// Nested abilities/actions are stored without client-side ids (mirroring how
// top-level actions/abilities are stored); ids are regenerated on read.
interface StoredMember {
  name?: string;
  paperforgeId?: string;
  hp?: number;
  hpPerHero?: number | null;
  armor?: MonsterArmor;
  size?: MonsterSize;
  saves?: string;
  actionPreface?: string;
  abilities?: Omit<Ability, "id">[];
  actions?: Omit<Action, "id">[];
}

const parseJsonField = <T>(value: unknown): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

const abilitiesWithIds = (
  items: Array<Omit<Ability, "id">> | undefined
): Ability[] =>
  (items ?? []).map((item) => ({ ...item, id: crypto.randomUUID() }));

const actionsWithIds = (
  items: Array<Omit<Action, "id">> | undefined
): Action[] =>
  (items ?? []).map((item) => ({ ...item, id: crypto.randomUUID() }));

/**
 * Parse the stored `members` column into runtime MonsterTeamMember objects,
 * assigning fresh ids to each member and its nested abilities/actions.
 */
export const parseMembers = (value: unknown): MonsterTeamMember[] =>
  parseJsonField<StoredMember>(value).map((m) => ({
    id: crypto.randomUUID(),
    name: m.name ?? "",
    paperforgeId: m.paperforgeId ?? undefined,
    hp: m.hp ?? 0,
    hpPerHero: m.hpPerHero ?? null,
    armor: m.armor ?? "none",
    size: m.size ?? "medium",
    saves: m.saves ?? undefined,
    actionPreface: m.actionPreface ?? undefined,
    abilities: abilitiesWithIds(m.abilities),
    actions: actionsWithIds(m.actions),
  }));

/**
 * Serialize runtime members for storage, dropping the ephemeral ids from the
 * members and their nested abilities/actions.
 */
export const stripMemberIds = (
  members: MonsterTeamMember[] | undefined
): StoredMember[] =>
  (members ?? []).map((m) => ({
    name: m.name,
    paperforgeId: m.paperforgeId,
    hp: m.hp,
    hpPerHero: m.hpPerHero ?? null,
    armor: m.armor,
    size: m.size,
    saves: m.saves,
    actionPreface: m.actionPreface,
    abilities: m.abilities.map(({ id, ...rest }) => rest),
    actions: m.actions.map(({ id, ...rest }) => rest),
  }));

/**
 * Flatten member abilities/actions so their descriptions can be scanned for
 * inline conditions alongside the top-level ones.
 */
export const collectMemberConditionSources = (
  members: MonsterTeamMember[] | undefined
): { actions: Action[]; abilities: Ability[] } => ({
  actions: (members ?? []).flatMap((m) => m.actions),
  abilities: (members ?? []).flatMap((m) => m.abilities),
});
