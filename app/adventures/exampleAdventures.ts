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
  parentId: string
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
  presentation: "note",
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

const hiddenHoneyCavern: AdventureInput = {
  name: "The Hidden Honey Cavern",
  tagline: "A sticky quest for Level 3 heroes",
  summary:
    "The insect-obsessed druid Kelebek is creating priceless magical honey in the Elderwild, but his cave is defended by creepy giant insects.",
  visibility: "public",
  nodes: [
    section(
      "going-on",
      "What's Going On?",
      "The insect-obsessed druid Kelebek is creating priceless magical honey in the Elderwild. *The only problem, Kelebek's cave is defended by creepy giant insects.*",
      0
    ),
    section(
      "quest-hooks",
      "Quest Hooks",
      "- **Finley Thistlepot.** An eager young member of the Explorer's Guild has returned from a herb-gathering expedition with the location of a hidden cave. He's planning to explore it further but needs backup in case it's dangerous.\n- **Odelis.** An enterprising member of the Tower is searching for a supply of magical honey. He's offering an outrageous sum of gold in exchange for a single jar.\n- **Tugrul.** A druid of the Elderwild wants to know how Kelebek creates his signature honey. She offers a pouch of restorative seeds that can fully heal one's Wounds in exchange for the recipe.",
      1
    ),
    section(
      "rumors",
      "Rumors",
      "- Kelebek's secret base is hidden behind a waterfall.\n- An ancient dragon lives near the waterfalls, guarding an invisible treasure hoard.\n- PJ and Jorgun of the Explorer's Guild were smuggling Red Sap and ducked into the cave to hide, but got separated and are now trapped inside.\n- Kelebek himself is a giant sentient insect! Don't get too close to his pet stinkbug.",
      2
    ),
    callout(
      "optional",
      "Optional!",
      "If your table is okay with a more gruesome story, or just wants a clear bad guy, Kelebek may lure travelers to his cave and use the bodies of those his insects capture as compost in his glade! Any NPC you deem appropriate may offer this information to your heroes.",
      0,
      "rumors"
    ),
    section(
      "travel",
      "Travel Encounters",
      "These encounters can occur while the heroes travel through the Elderwild toward the cavern.",
      3
    ),
    section(
      "treants",
      "Treant Sentinels",
      'A group of Treant Saplings surrounds the heroes, mistaking them for sap harvesters. "Interlopers! The trees bleed—admit it, you carry their lifeblood!" Easy to trick or convince otherwise, but anyone with an axe or fire is mistrusted.',
      0,
      "travel"
    ),
    section(
      "mushrooms",
      "Redcap Mushrooms",
      "**DC 10 Naturecraft:** These are Bloodshrooms: they act as healing potions, and 1d4+1 are ready to be harvested. **DC 18 Naturecraft:** Adventurer's Bane; look almost identical to Bloodshrooms. *Do not heal.* Instead, the eater hallucinates, seeing allies as enemies for 1 round.",
      1,
      "travel"
    ),
    section(
      "sage",
      "The Verdant Sage",
      'A blind, elderly green dragon, exceptionally well camouflaged (**DC 22 Perception to spot**). An old booming voice in Draconic asks: "Do you come seeking my unseen treasure? Come now, share of your treasure and I will respond in kind."\n\n- He offers some of his invisible treasure hoard—knowledge—answering questions and sharing rumors or information on the Elderwild.\n- He speaks Common reluctantly, but may offer less information.',
      2,
      "travel"
    ),
    section(
      "locations",
      "Adventure Locations",
      "The cave is organized into the following locations. Heroes may approach them in different ways depending on what they discover.",
      4
    ),
    section(
      "entrance",
      "Cavern Entrance",
      "*A small lake and rushing waterfall blocks the entrance to a hidden cave.*\n\n- If you weren't specifically told where it was, you'd have never guessed!\n- A giant insect in the water spots the heroes and begins swimming toward them.\n- Name is Xid. Will offer a ride through the waterfall in exchange for something shiny. Warns that no one he's taken into the cave ever comes back out.",
      0,
      "locations"
    ),
    section(
      "tunnel",
      "Tunnel",
      "*Long damp tunnel, ends in a dry chamber covered in dead leaves, twigs, and acorns.*\n\n- Purposefully, carefully kept dry and covered across the entire floor.\n- Pill bugs the size of an adult leg silently crawl on the ceiling and munch on moss-covered walls.\n- Stepping on the litter or speaking above a whisper causes pill bugs to drop from the ceiling and try to suffocate the heroes. **DC 12 DEX save** or Grappled, Blinded, and suffocating; take 1 Wound per round until escaping.",
      1,
      "locations"
    ),
    callout(
      "grapple",
      "Escaping a Grapple",
      "**Action:** make a STR or DEX save to escape. Remember allies can help as well!",
      0,
      "tunnel"
    ),
    section(
      "spider-lair",
      "Spider Lair",
      "*A dusty, WEB-filled cavern.*\n\n- Giant Spiders are wrapping up a squirming person in a web cocoon.\n- The spiders enthusiastically greet anyone entering their lair.\n- PJ, a goblin from the Explorer's Guild, is wrapped in the cocoon. If not freed soon, the spiders will eat him. He issues muffled pleas for help and offers extravagant promises: treasure, fame, and your wildest dreams—though he has none to offer.",
      2,
      "locations"
    ),
    section(
      "wax-maze",
      "Wax-Chamber Maze",
      "*Walls of thick wax form a confusing maze-like chamber.*\n\n- **Skill challenge:** Heroes must succeed on 3 different skill checks before 3 failures (**DC 10, 13, 16**). A great idea can gain advantage or succeed automatically.\n- Success leads to Larva Nursery, failure to the Storeroom.\n- Wax walls can be easily melted or otherwise destroyed, but Wax Golems rise to defend the area.",
      3,
      "locations"
    ),
    section(
      "larva-nursery",
      "Larva Nursery",
      "*Lined with soft glowing honeycomb.*\n\n- Buzzing with young larvae. Curious but harmless, mimicking the heroes' movements.\n- If harmed, they let out a shrill squeal, alerting the drones in the Bee Hive who attack ferociously.",
      4,
      "locations"
    ),
    section(
      "central-hive",
      "Central Hive",
      "*Cacophonous thrumming.*\n\n- An ever-buzzing line of Giant Bee Drones transports nectar from the Glade into the Hive. Glass jars are filled with mature honey and drones carry them into the Storeroom for safekeeping.\n- Interfere with production and the bees will attack.",
      5,
      "locations"
    ),
    section(
      "storeroom",
      "Storeroom",
      "*A small dark cave, foul smelling.*\n\n- Filled with dried flowers, steaming heaps of compost, scraps of adventuring gear, and jars of honey.\n- Giant Slugs slide over every surface, emanating a discordant tune. An orc, Jorgun of the Explorer's Guild, is slumped over a crate, snoring loudly.\n- Spending time here causes heroes to slowly begin to suffer the sleepy effects of the slugs' song.",
      6,
      "locations"
    ),
    section(
      "glade",
      "Glade",
      "*Lush cave, filled with a variety of huge flowers.*\n\n- An insect-like druid, Kelebek, tends to the flowers carefully. He is accompanied by a Giant Stinkbug named Poppy.",
      7,
      "locations"
    ),
    callout(
      "negotiation",
      "Combat or Peaceful Negotiation?",
      "Not every adventure needs to end with combat with a bad guy! Sometimes a successful negotiation can be more rewarding. Think about what would be more fun, give your players options, and feel free to go in any direction that makes sense.",
      0,
      "glade"
    ),
    section(
      "kelebek",
      "Kelebek",
      "- **What Kelebek Wants:** Recognition and to protect his honey. Kelebek views the magical honey as his life's work and craves acknowledgment of his mastery.\n- **Peaceful Negotiation:** Flattering his genius, offering a trade, or offering to rid the Elderwild of a mutual threat may sway Kelebek into letting go of a single jar of honey.\n- **Fight:** Heroes may attack after learning of his treatment toward those who stumble into his cave—or simply if they don't like bugs! Alternatively, Kelebek may attack first if the heroes have taken anything or harmed his insects.",
      8,
      "locations"
    ),
  ],
};

export interface HiddenHoneyCavernMonsterIds {
  giantSpiderId?: string;
  waxGolemId?: string;
}

export function getExampleAdventures({
  giantSpiderId,
  waxGolemId,
}: HiddenHoneyCavernMonsterIds = {}): Record<string, AdventureInput> {
  return {
    "hidden honey cavern": {
      ...hiddenHoneyCavern,
      nodes: [
        ...hiddenHoneyCavern.nodes,
        ...(giantSpiderId
          ? [statblock("spider-lair-monster", giantSpiderId, "spider-lair")]
          : []),
        ...(waxGolemId
          ? [statblock("wax-maze-monster", waxGolemId, "wax-maze")]
          : []),
      ],
    },
  };
}
