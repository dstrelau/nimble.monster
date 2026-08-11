import type { AdventureInput, AdventureNodeInput } from "@/lib/db/adventures";

const section = (
  id: string,
  title: string,
  content: string,
  orderIndex: number,
  parentId: string | null = null
): AdventureNodeInput => ({
  id,
  parentId,
  kind: "section",
  orderIndex,
  title,
  content,
  encounterId: null,
  monsterIds: [],
  itemIds: [],
  missingStatblockCount: 0,
  presentation: null,
});

const callout = (
  id: string,
  title: string,
  content: string,
  orderIndex: number,
  parentId: string | null,
  presentation: AdventureNodeInput["presentation"] = "note"
): AdventureNodeInput => ({
  id,
  parentId,
  kind: "callout",
  orderIndex,
  title,
  content,
  encounterId: null,
  monsterIds: [],
  itemIds: [],
  missingStatblockCount: 0,
  presentation,
});

const text = (
  id: string,
  content: string,
  orderIndex: number,
  parentId: string
): AdventureNodeInput => ({
  id,
  parentId,
  kind: "text",
  orderIndex,
  title: "",
  content,
  encounterId: null,
  monsterIds: [],
  itemIds: [],
  missingStatblockCount: 0,
  presentation: null,
});

const image = (
  id: string,
  orderIndex: number,
  parentId: string
): AdventureNodeInput => ({
  id,
  parentId,
  kind: "image",
  orderIndex,
  title: "",
  content: "",
  encounterId: null,
  monsterIds: [],
  itemIds: [],
  missingStatblockCount: 0,
  imageId: null,
  imageExtension: null,
  caption: "",
  presentation: null,
});

const statblock = (
  id: string,
  monsterId: string,
  parentId: string
): AdventureNodeInput => ({
  id,
  parentId,
  kind: "monsters",
  orderIndex: 0,
  title: "",
  content: "",
  encounterId: null,
  monsterIds: [monsterId],
  itemIds: [],
  missingStatblockCount: 0,
  presentation: null,
});

const delianTomb: AdventureInput = {
  name: "The Delian Tomb",
  tagline: "A classic five-room dungeon for Level 1 heroes",
  summary:
    "Goblin raiders have taken a villager to an ancient knightly tomb, where a rescue mission uncovers a forgotten oath and a hidden crypt.",
  visibility: "public",
  nodes: [
    callout(
      "source",
      "About This Adventure",
      "This sample is a concise Nimble adaptation of **The Delian Tomb**, the starter dungeon created by Matt Colville for MCDM's *Running the Game* series. Adjust names, encounter sizes, and rewards to fit your campaign.",
      0,
      null
    ),
    section(
      "going-on",
      "What's Going On?",
      "A band of goblins has been raiding the farms around a quiet village. Their latest attack ended with a local named Bess dragged into the forest. The raiders have made their lair in the tomb of the Delian Order, a company of knights remembered for defending the realm from chaos.",
      1
    ),
    section(
      "quest-hooks",
      "Quest Hooks",
      "- **A desperate plea.** Bess's father, the village blacksmith, begs the heroes to follow the raiders before the trail goes cold.\n- **A standing bounty.** The village reeve offers coin for proof that the goblin threat has ended.\n- **Missing travelers.** A merchant's abandoned cart suggests the goblins may hold more captives—or more loot—at their hideout.",
      2
    ),
    callout(
      "quest-hooks-tip",
      "",
      "These are only a few of the possible ways to get your party interested in exploring the tomb. Be creative!",
      0,
      "quest-hooks",
      "tip"
    ),
    section(
      "following-trail",
      "Following the Trail",
      "The goblins left tracks leading into the forest. No check is needed to follow them, but DC 10 Examination to notice several goblins split off from the main group.",
      3
    ),
    text(
      "goblin-patrol",
      "A patrol of 1 **Goblin Minion** per hero circles behind anyone following the main trail. The goblins attack from cover, then retreat toward the tomb if the fight turns against them. A captured patrol member can reveal that the prisoner is still alive and a ceremony will begin soon.",
      0,
      "following-trail"
    ),
    section(
      "locations",
      "The Tomb",
      "Weathered steps climb to a stone door set into a wooded hillside. The worn relief above it depicts a knight driving back a many-headed beast. The goblins use the old complex as a hideout but do not understand all of its secrets.",
      4
    ),
    image("tomb-map", 0, "locations"),
    section(
      "entrance",
      "1. The Lookouts",
      "**Goblins** (1 per 2 Heroes) guard the entrance. Heroes who succeed Stealth check approach unnoticed. If a guard escapes inside, the goblins in the offering chamber prepare an ambush.",
      1,
      "locations"
    ),
    section(
      "offering-chamber",
      "2. Offering Chamber",
      "A cold brazier stands beneath a faded carving of the Delian knights. Several goblins camp among broken offerings and bedrolls. Knights' oath engraved in stone: *Through honor and courage, we give our word to stand against chaos.* The inscription matters deeper in the tomb.",
      2,
      "locations"
    ),
    callout(
      "retreating-goblins",
      "Raise the Alarm",
      "A goblin reduced to half HP tries to flee toward the ritual chamber. If it escapes, add one Goblin to the final fight or let the boss begin in a defensible position.",
      0,
      "offering-chamber",
      "optional"
    ),
    section(
      "trapped-hall",
      "3. Trapped Hall",
      "DEX save or 1d6 damage. _Small_ characters do not trigger trap. Functions Heroes - 1 times.",
      3,
      "locations"
    ),
    section(
      "ritual-chamber",
      "4. Ritual Chamber",
      "The goblin leader conducts a crude ceremony before an ancient stone altar while Bess waits nearby, bound but unharmed. Goblin minions protect their leader and threaten the prisoner if cornered. A bold distraction, negotiation, or stealthy rescue can change the shape of the fight before initiative is rolled.",
      4,
      "locations"
    ),
    section(
      "rescuing-bess",
      "Rescuing Bess",
      "Bess can free herself if a hero reaches her and spends an action cutting the ropes. She knows the goblins avoid the statue chamber and heard them whisper about a door that only opens for 'real knights.'",
      5,
      "locations"
    ),
    section(
      "statue-chamber",
      "5. Statue Chamber",
      "A stone knight watches over empty burial niches. The inscription on its pedestal asks visitors to offer what an honorable knight must always keep. Speaking the oath from the offering chamber—or simply giving one's word—causes a concealed door to grind open.",
      6,
      "locations"
    ),
    callout(
      "word-puzzle",
      "The Knight's Word",
      "Do not gate the hidden crypt behind a roll. Reward players who connect the oath to the riddle, and accept any sincere promise that fits the ideals of the Delian Order.",
      0,
      "statue-chamber"
    ),
    section(
      "hidden-crypt",
      "6. Hidden Crypt",
      "Beyond the secret door lie the resting places of the Delian knights. When the heroes disturb the central sarcophagus or its treasures, ancient skeletons rise to test whether these intruders are worthy of the order's legacy. The crypt holds a fine weapon bearing the Delian crest and enough coin to reward curious heroes.",
      7,
      "locations"
    ),
    section(
      "aftermath",
      "Aftermath",
      "Returning Bess safely earns the village's gratitude and the promised reward. A surviving goblin may mention a larger tribe elsewhere in the forest, while the Delian weapon or oath can draw the heroes into the lost order's unfinished business.",
      5
    ),
  ],
};

export const EXAMPLE_ADVENTURE_IMAGES = {
  "delian tomb": [
    {
      nodeId: "tomb-map",
      path: "/images/adventures/delian-tomb/map.jpg",
    },
  ],
};

export interface DelianTombMonsterIds {
  goblinMinionId?: string;
  goblinId?: string;
  bugbearId?: string;
  skeletonId?: string;
}

export function getExampleAdventures({
  goblinMinionId,
  goblinId,
  bugbearId,
  skeletonId,
}: DelianTombMonsterIds = {}): Record<string, AdventureInput> {
  return {
    "delian tomb": {
      ...delianTomb,
      nodes: [
        ...delianTomb.nodes,
        ...(goblinMinionId
          ? [statblock("patrol-monster", goblinMinionId, "following-trail")]
          : []),
        ...(goblinId
          ? [statblock("lookout-monster", goblinId, "entrance")]
          : []),
        ...(bugbearId
          ? [statblock("ritual-leader-monster", bugbearId, "ritual-chamber")]
          : []),
        ...(skeletonId
          ? [statblock("crypt-monster", skeletonId, "hidden-crypt")]
          : []),
      ],
    },
  };
}
