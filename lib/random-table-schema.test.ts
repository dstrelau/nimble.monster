import { describe, expect, it } from "vitest";
import { RandomTableSchema } from "@/lib/random-table-schema";

const table = (subtables: unknown[]) => ({
  name: "Roadside Finds",
  description: "",
  visibility: "public" as const,
  subtables,
});

describe("RandomTableSchema", () => {
  it("preserves persisted IDs and rejects malformed or duplicate IDs", () => {
    const subtable = {
      id: "56648cf2-a838-40dc-a66a-2712ea10c5a7",
      title: "Weather",
      columns: [{ id: "result", name: "Result" }],
      rows: [{ cells: { result: "Clear" } }],
    };
    expect(RandomTableSchema.parse(table([subtable])).subtables[0].id).toBe(
      subtable.id
    );
    expect(
      RandomTableSchema.safeParse(table([{ ...subtable, id: "bad-id" }]))
        .success
    ).toBe(false);
    expect(
      RandomTableSchema.safeParse(table([subtable, subtable])).success
    ).toBe(false);
    const { id: _id, ...newSubtable } = subtable;
    expect(
      RandomTableSchema.safeParse(table([newSubtable, newSubtable])).success
    ).toBe(true);
  });

  it("accepts arbitrary columns and cell values", () => {
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Weapons",
          columns: [
            { id: "roll", name: "1d6" },
            { id: "weapon", name: "Weapon" },
            { id: "price", name: "Price" },
            { id: "damage", name: "Damage" },
          ],
          rows: [
            {
              cells: {
                roll: "1",
                weapon: "Dagger",
                price: "5 gp",
                damage: "1d4",
              },
            },
          ],
        },
      ])
    );

    expect(result.success).toBe(true);
  });

  it("treats dice notation as ordinary column text", () => {
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Odd die",
          columns: [{ id: "roll", name: "1d7" }],
          rows: [{ cells: { roll: "anything" } }],
        },
      ])
    );

    expect(result.success).toBe(true);
  });

  it("rejects duplicate column IDs", () => {
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Weapons",
          columns: [
            { id: "value", name: "Weapon" },
            { id: "value", name: "Price" },
          ],
          rows: [{ cells: { value: "Dagger" } }],
        },
      ])
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Column IDs must be unique");
  });

  it("requires table and column names", () => {
    const unnamedTable = RandomTableSchema.safeParse(
      table([
        {
          title: "",
          columns: [{ id: "result", name: "Result" }],
          rows: [{ cells: { result: "Clear" } }],
        },
      ])
    );
    const unnamedColumn = RandomTableSchema.safeParse(
      table([
        {
          title: "Weather",
          columns: [{ id: "result", name: "" }],
          rows: [{ cells: { result: "Clear" } }],
        },
      ])
    );

    expect(unnamedTable.success).toBe(false);
    expect(unnamedColumn.success).toBe(false);
  });

  it("requires at least one table, column, and row", () => {
    expect(RandomTableSchema.safeParse(table([])).success).toBe(false);
    expect(
      RandomTableSchema.safeParse(
        table([{ title: "Weather", columns: [], rows: [] }])
      ).success
    ).toBe(false);
  });
});
