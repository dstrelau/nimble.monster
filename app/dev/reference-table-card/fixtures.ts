import equipmentTables from "@/data/official/core/equipment-tables.json";
import type { RandomTable, User } from "@/lib/types";
import { STRESS_TEST_TABLE } from "../random-tables/fixtures";

const creator: User = {
  id: "reference-table-lab",
  discordId: "",
  username: "reference-table-lab",
  displayName: "Fixture Maker",
};

interface CardFixture {
  label: string;
  table: RandomTable;
}

export const CARD_FIXTURES: CardFixture[] = [
  {
    label: "Minimal · one table · two columns · no description",
    table: {
      id: "",
      creator,
      name: "Travel Costs",
      visibility: "private",
      subtables: [
        {
          title: "Travel Costs",
          columns: [
            { id: "route", name: "Route" },
            { id: "cost", name: "Cost" },
          ],
          rows: [
            { cells: { route: "Town to city", cost: "5 gp" } },
            { cells: { route: "City to capital", cost: "20 gp" } },
          ],
        },
      ],
    },
  },
  ...equipmentTables.data.map(
    ({ attributes }): CardFixture => ({
      label:
        attributes.subtables.length === 1
          ? "Dense · one table · many rows"
          : `${attributes.subtables.length} tables · official equipment reference`,
      table: {
        ...attributes,
        id: "",
        creator: {
          ...creator,
          displayName: "Nimble Co.",
          username: "nimble-co",
        },
        visibility: "public",
      },
    })
  ),
  {
    label: "Wide · ten columns · long text and column names",
    table: {
      ...STRESS_TEST_TABLE,
      creator,
      name: "Expanded Weapons Catalog",
      description:
        "A **wide reference** for unusual weapons, prices, damage, range, handling, weight, traits, rarity, and detailed notes.\n\nThis intentionally long description tests whether the card keeps its contents readable without letting supporting text overwhelm the overview.",
      subtables: STRESS_TEST_TABLE.subtables.slice(0, 1).map((subtable) => ({
        ...subtable,
        columns: subtable.columns.map((column) =>
          column.id === "notes"
            ? { ...column, name: "Special handling and maintenance notes" }
            : column
        ),
      })),
    },
  },
];
