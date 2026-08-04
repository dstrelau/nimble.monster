import type {
  Hazard,
  MonsterArmor,
  MonsterFormState,
  MonsterSize,
} from "../monsters/types";

const STORAGE_ARMOR: MonsterArmor = "none";
const STORAGE_SIZE: MonsterSize = "medium";

/** Adapter for shared creature/hazard rendering components. */
export function toHazardMonsterView(hazard: Hazard): MonsterFormState {
  return {
    ...hazard,
    hp: 0,
    hpPerHero: null,
    armor: STORAGE_ARMOR,
    size: STORAGE_SIZE,
    speed: 0,
    fly: 0,
    swim: 0,
    climb: 0,
    burrow: 0,
    teleport: 0,
    families: [],
    members: [],
    legendary: false,
    minion: false,
    bloodied: "",
    lastStand: "",
    saves: "",
    kind: "",
    role: null,
  };
}
