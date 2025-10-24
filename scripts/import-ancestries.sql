-- Importing 24 ancestries

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Birdfolk',
  'Birdfolk find sanctuary not in stone or chains, but within the boundless expanse of the sky. However, the gift of flight comes at a cost—hollow bones, and commensurate frailty.',
  ARRAY['small','medium']::size_type[],
  ARRAY['{"name":"Hollow Bones","description":"You have a fly Speed as long as you are wearing armor no heavier than Leather. Crits against you are Vicious (the attacker rolls 1 additional die). Forced movement moves you twice as far."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Bunbun',
  'Bunbun are agile and unpredictable, using their powerful legs to leap great distances and catch foes off guard. Facing a Bunbun means contending with an opponent who can strike from unexpected angles and swiftly reposition themselves in the heat of battle.',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Bunny Legs","description":"Before Interposing or after Defending (after damage), hop up to your Speed in any direction for free, 1/encounter."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Celestial',
  'Descendants of divine beings, Celestials carry an aura of nobility and grace. Their innate connection to the higher planes allows them to resist the effects of misfortune, standing strong where others may falter.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Highborn","description":"Your disadvantaged save is Neutral instead. You know Celestial if your INT isn’t negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Changeling',
  'Often hunted for their silver blood, Changelings are natural survivors, slipping into new identities with ease. Changelings that shift too often typically aren’t long for the world—they can struggle to remember who they once were, becoming little more than reflections of the faces they wear.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"New Place, New Face","description":"+2 shifting skill points. You may take on the appearance of any ancestry. When you do, you may place your 2 shifting skill points into any 1 skill. 1/day."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Crystalborn',
  'Formed from living crystal, the Crystalborn are beings of dazzling beauty and otherworldly toughness. Their translucent bodies refract light and sound, granting them unique abilities in combat.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Reflective Aura","description":"When you Defend, gain KEY armor and deal KEY damage back to the attacker. 1/encounter."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Dragonborn',
  'The soul of a dragon burns within you, the scales of your body are like forged steel. You are a kiln and your heritage the coals that stoke your flames. Call upon your wrath, to speak in the tongue of your ancestors and imbue unbridled fury into your attacks.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Draconic Heritage","description":"+1 Armor. When you attack: deal an additional LVL+KEY damage (ignoring armor) divided as you choose among any of your targets; recharges whenever you Safe Rest or gain a Wound. You know Draconic if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Dryad/Shroomling',
  'Tied to the natural world, Dryads and Shroomlings embody the balance between flora and fauna. Their unique physiology releases toxic spores when harmed, providing a natural defense against those who dare to harm them.',
  ARRAY['small','medium']::size_type[],
  ARRAY['{"name":"Danger Pollen/Spores","description":"Whenever an enemy causes you one or more Wounds, you excrete soporific spores: all adjacent enemies are Dazed. You know Elvish if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Dwarf',
  'Dwarf, in the old language, means “stone.” You are resilient, solid, stout. Even when driven to exhaustion, you will not falter. Forgoing speed, you are gifted with physical vitality and a belly that can handle the finest (and worst) consumables this world has to offer.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Stout","description":"+2 max Hit Dice, +1 max Wounds, –1 Speed. You know Dwarvish if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Elf',
  'Elves epitomize swiftness and grace. Their tall, slender forms belie their innate speed, grace, and wit. Formidable in both diplomacy and combat, elves strike swiftly, often preventing the worst by acting first.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Lithe","description":"Advantage on Initiative, +1 Speed. You know Elvish if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Fiendkin',
  'Said to have been born from the union of man and fiend, or from a cursed bloodline, Fiendkin often find themselves outcasts in society. Yet, they embody determination in the face of adversity. Their ancestors didn’t emerge from the depths of the Everflame to succumb to minor setbacks!',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Flameborn","description":"1 of your neutral saves is advantaged instead. You know Infernal if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Gnome',
  'Eccentric, curious, and perpetually optimistic, gnomes are cheerful—especially when compared to their typically grumpier and larger kin, the dwarves. Known for their tinkering, spreading cheer, and playful antics, gnomes pursue their passions with a scatterbrained enthusiasm.',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Optimistic","description":"Allow an ally within Reach 6 to reroll any single die, resets when healed to your max HP. –1 Speed. You know Dwarvish if your INT is not negative (but you call it Gnomish, of course)."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Goblin',
  'Green, cunning, and perpetually vilified, Goblins thrive on the edge of chaos. For a Goblin, vanishing into the shadows is not just a skill—it’s an identity. After all, what kind of Goblin would you be if you couldn’t slip away unnoticed?',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Skedaddle","description":"Can move 2 spaces for free after you become the target of an attack or negative effect (after damage, ignoring difficult terrain). You know Goblin if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Half-Giant',
  'Towering beings whose strength is as immovable as the mountains they call home. Their sheer size and resilience make them fearsome opponents, capable of surviving even devastating blows.',
  ARRAY['large']::size_type[],
  ARRAY['{"name":"Strength of Stone","description":"Force an enemy to reroll a crit against you, 1/encounter. +2 Might. You know Dwarvish if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Halfling',
  'Kind of like a human, but smaller (except for the feet). Where does our luck come from? Well…you know what they say about rabbit feet? Well, we’ve got feet for days compared to them. Imagine the amount of luck you could fit into these bad boys!',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Elusive","description":"+1 to Stealth. If you fail a save, you can succeed instead, 1/Safe Rest."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Human',
  'Found in every terrain and environment, their curiosity and ambition drive them to explore every corner of the world, making them a ubiquitous and versatile race.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Tenacious","description":"+1 to all skills and Initiative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Kobold',
  'Small, often maniacal, and dragon–obsessed. Kobolds thrive in the shadows, finding ingenious ways to survive despite their diminutive size. Underestimated by many, Kobolds prove time and again that even the smallest among us can wield great power.',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Wily","description":"Force an enemy to reroll a non-critical attack against you, 1/encounter. +3 to Influence friendly characters. Advantage on skill checks related to dragons. You know Draconic if your INT is not negative."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Minotaur/Beastfolk',
  'Minotaur and other Beastfolk embody a primal connection to The Wild, combining strength with natural agility. Their powerful build allows them to move swiftly, whether repositioning to outflank foes or charging in with unstoppable force.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Charge","description":"When you move at least 4 spaces, you can push a creature in your path. Medium: 1 space; Small/Tiny: up to 2 spaces. 1/turn."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Oozeling/Construct',
  'What even is a “PeOpLe“ anyway? So what if your heart pumps oil instead of blood, so what if you don’t even have a heart!? If you can squish yourself into a pair of pants, or swing a sword like everyone else, who’s to say you can’t be a pEOpLe, too?!',
  ARRAY['small','medium']::size_type[],
  ARRAY['{"name":"Odd Constitution","description":"Increment your Hit Dice one step (d6 » d8 » d10 » d12 » d20); they always heal you for the maximum amount. Magical healing always heals you for the minimum amount."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Orc',
  'Just when you think you’ve bested a mighty Orc, you’ve merely succeeded in rousing their anger. Engaging in combat with an Orc is no endeavor for the weak-willed. While others may cower before death’s approach, Orcs boldly defy its grasp.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Relentless","description":"When you would drop to 0 HP, you may set your HP to LVL instead, 1/Safe Rest. +1 Might. You know Goblin if your INT is not negative (but you call it Orcish, of course)."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Planarbeing',
  'You are not from this plane of existence—your soul is not as strongly tethered to it as others. But with this vulnerability comes power, the ability to temporarily shift from one plane to another in times of dire need.',
  ARRAY['medium']::size_type[],
  ARRAY['{"name":"Planeshift","description":"Whenever you Defend, you can gain 1 Wound to temporarily phase out of the material plane and ignore the damage. –2 max Wounds."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Ratfolk',
  'Ratfolk are survivors, thriving in the shadows of society where others fear to tread. Agile, resourceful, and fiercely loyal to their own, they have a knack for turning scraps into solutions.',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Scurry","description":"Gain +2 armor if you moved on your last turn."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Stoatling',
  'Stoatlings may be small, but they’re far from weak. With fierce determination and warrior hearts, they can take down foes many times their size. Their agility and tenacity let them exploit larger enemies’ weaknesses, turning their size into a lethal advantage.',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Small But Ferocious","description":"Whenever you make a single-target attack against a creature larger than you, roll 1 additional d6 for each size category it is larger. They do the same."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Turtlefolk',
  'Turtlefolk take their time in everything they do; they are patient, sturdy, and slow to anger. They rely on their thick shells for protection, making them difficult to harm, but their cautious movements come at the cost of speed.',
  ARRAY['small','medium']::size_type[],
  ARRAY['{"name":"Slow & Steady","description":"+4 Armor, –2 speed."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);

INSERT INTO ancestries (id, name, description, size, abilities, user_id, rarity, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Wyrdling',
  'Unpredictable and chaotic, Wyrdlings are the result of magic gone awry. Their bodies pulse with raw arcane energy, and their mere presence often disturbs the balance of magic around them.',
  ARRAY['small']::size_type[],
  ARRAY['{"name":"Chaotic Surge","description":"Whenever you or a willing ally within Reach 6 casts a tiered spell, you may allow them to roll on the Chaos Table. 1/encounter."}']::jsonb[],
  '00000000-0000-0000-0000-000000000001',
  'exotic',
  NOW(),
  NOW()
);
