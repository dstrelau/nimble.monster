import type { Monster } from "@/lib/services/monsters";

export function monsterToMarkdown(monster: Monster): string {
  const tags = generateTags(monster);
  const frontmatter = generateFrontmatter(monster, tags);
  const body = generateBody(monster);

  return `${frontmatter}\n${body}`;
}

function generateTags(monster: Monster): string[] {
  const tags = ["dnd", "monster"];

  if (monster.legendary) tags.push("legendary");
  if (monster.minion) tags.push("minion");
  if (monster.role) tags.push(monster.role);
  if (monster.level) tags.push(`lvl-${monster.level}`);

  monster.families.forEach((family) => {
    tags.push(family.name.toLowerCase().replace(/\s+/g, "-"));
  });

  return tags;
}

function generateFrontmatter(monster: Monster, tags: string[]): string {
  const lines = ["---"];

  lines.push(`name: "${escapeYaml(monster.name)}"`);
  lines.push(`level: ${monster.level}`);
  if (monster.kind) lines.push(`kind: "${escapeYaml(monster.kind)}"`);
  if (monster.role) lines.push(`role: ${monster.role}`);

  lines.push(`hp: ${monster.hp}`);
  lines.push(`armor: ${monster.armor}`);
  lines.push(`size: ${monster.size}`);
  lines.push(`visibility: ${monster.visibility}`);

  if (monster.source) {
    lines.push(`source: "${escapeYaml(monster.source.name)}"`);
  }

  lines.push(`tags: [${tags.join(", ")}]`);

  lines.push("---");
  return lines.join("\n");
}

function generateBody(monster: Monster): string {
  const sections: string[] = [];

  sections.push(generateHeader(monster));
  sections.push(generateStats(monster));

  if (monster.saves) {
    sections.push(generateSaves(monster.saves));
  }

  if (monster.families.length > 0 || monster.abilities.length > 0) {
    sections.push(generateAbilities(monster));
  }

  if (monster.actions.length > 0) {
    sections.push(generateActions(monster));
  }

  if (monster.legendary && (monster.bloodied || monster.lastStand)) {
    sections.push(generateLegendary(monster));
  }

  if (monster.moreInfo) {
    sections.push(generateMoreInfo(monster.moreInfo));
  }

  sections.push(generateMetadata(monster));

  return sections.join("\n\n");
}

function generateHeader(monster: Monster): string {
  const typeLabel = monster.legendary
    ? "Legendary"
    : monster.minion
      ? "Minion"
      : "";
  const subtitle = [
    `Level ${monster.level}`,
    monster.kind,
    monster.role,
    typeLabel,
  ]
    .filter(Boolean)
    .join(" ");

  return `# ${monster.name}\n\n*${subtitle}*`;
}

function generateStats(monster: Monster): string {
  const lines = ["## Stats"];

  lines.push(`- **HP**: ${monster.hp}`);
  lines.push(`- **Armor**: ${monster.armor}`);
  lines.push(`- **Size**: ${monster.size}`);

  const movement = [`${monster.speed}`];
  if (monster.fly > 0) movement.push(`fly ${monster.fly}`);
  if (monster.swim > 0) movement.push(`swim ${monster.swim}`);
  if (monster.climb > 0) movement.push(`climb ${monster.climb}`);
  if (monster.burrow > 0) movement.push(`burrow ${monster.burrow}`);
  if (monster.teleport > 0) movement.push(`teleport ${monster.teleport}`);

  lines.push(`- **Speed**: ${movement.join(", ")}`);

  return lines.join("\n");
}

function generateSaves(saves: string): string {
  return `## Saves\n\n${saves}`;
}

function generateAbilities(monster: Monster): string {
  const lines = ["## Abilities"];

  if (monster.families.length > 0) {
    for (const family of monster.families) {
      if (family.abilities.length > 0) {
        lines.push(`\n### ${family.name}`);
        if (family.description) {
          lines.push(`\n*${family.description}*`);
        }
        for (const ability of family.abilities) {
          lines.push(`- **${ability.name}**: ${ability.description}`);
        }
      }
    }
  }

  if (monster.abilities.length > 0) {
    for (const ability of monster.abilities) {
      lines.push(`- **${ability.name}**: ${ability.description}`);
    }
  }

  return lines.join("\n");
}

function generateActions(monster: Monster): string {
  const lines = ["## Actions"];

  if (monster.actionPreface) {
    lines.push(`\n${monster.actionPreface}`);
  }

  for (const action of monster.actions) {
    let actionLine = `- **${action.name}**`;

    const details = [];
    if (action.damage) details.push(action.damage);
    if (action.range) details.push(action.range);

    if (details.length > 0) {
      actionLine += ` (${details.join(", ")})`;
    }

    if (action.description) {
      actionLine += `: ${action.description}`;
    }

    lines.push(actionLine);
  }

  return lines.join("\n");
}

function generateLegendary(monster: Monster): string {
  const lines = [];

  if (monster.bloodied) {
    lines.push(`**Bloodied**: ${monster.bloodied}`);
  }

  if (monster.lastStand) {
    lines.push(`**Last Stand**: ${monster.lastStand}`);
  }

  return lines.join("\n");
}

function generateMoreInfo(moreInfo: string): string {
  return `## More Info\n\n${moreInfo}`;
}

function generateMetadata(monster: Monster): string {
  const lines = ["---"];

  if (monster.creator) {
    lines.push(
      `*Created by ${monster.creator.displayName} (@${monster.creator.username})*`
    );
  }

  if (monster.source) {
    lines.push(`*Source: ${monster.source.name}*`);
  }

  if (monster.remixedFrom) {
    lines.push(
      `*Remixed from: ${monster.remixedFrom.name} by ${monster.remixedFrom.creator.displayName}*`
    );
  }

  if (monster.awards && monster.awards.length > 0) {
    const awardNames = monster.awards.map((a) => a.name).join(", ");
    lines.push(`*Awards: ${awardNames}*`);
  }

  return lines.join("\n");
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"');
}
