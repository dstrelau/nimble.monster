import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DieResult } from "@/lib/dice";
import { DiceRollDisplay } from "./DiceRollDisplay";

afterEach(() => {
  cleanup();
});

describe("DiceRollDisplay", () => {
  it("sorts dice results in correct order: primary, regular, dropped, explosion, vicious", () => {
    const results: DieResult[] = [
      { value: 5, dieSize: 6, type: "vicious", isCrit: false, isMiss: false },
      { value: 6, dieSize: 6, type: "explosion", isCrit: true, isMiss: false },
      { value: 3, dieSize: 6, type: "regular", isCrit: false, isMiss: false },
      { value: 4, dieSize: 6, type: "primary", isCrit: false, isMiss: false },
      { value: 2, dieSize: 6, type: "dropped", isCrit: false, isMiss: false },
    ];

    const { container } = render(
      <DiceRollDisplay results={results} modifier={0} total={18} />
    );

    const values = Array.from(
      container.querySelectorAll(".text-xl.md\\:text-2xl.font-bold")
    ).map((el) => el.textContent);

    expect(values).toEqual(["4", "3", "2", "6", "5"]);
  });

  it("maintains sort order with multiple regular dice", () => {
    const results: DieResult[] = [
      { value: 8, dieSize: 8, type: "regular", isCrit: false, isMiss: false },
      { value: 6, dieSize: 8, type: "primary", isCrit: false, isMiss: false },
      { value: 7, dieSize: 8, type: "regular", isCrit: false, isMiss: false },
    ];

    const { container } = render(
      <DiceRollDisplay results={results} modifier={2} total={23} />
    );

    const values = Array.from(
      container.querySelectorAll(".text-xl.md\\:text-2xl.font-bold")
    ).map((el) => el.textContent);

    expect(values).toEqual(["6", "8", "7"]);
  });

  it("places explosions and vicious dice at the end", () => {
    const results: DieResult[] = [
      { value: 20, dieSize: 20, type: "primary", isCrit: true, isMiss: false },
      {
        value: 15,
        dieSize: 20,
        type: "explosion",
        isCrit: true,
        isMiss: false,
      },
      { value: 12, dieSize: 20, type: "vicious", isCrit: false, isMiss: false },
      { value: 10, dieSize: 20, type: "regular", isCrit: false, isMiss: false },
    ];

    const { container } = render(
      <DiceRollDisplay results={results} modifier={5} total={62} />
    );

    const values = Array.from(
      container.querySelectorAll(".text-xl.md\\:text-2xl.font-bold")
    ).map((el) => el.textContent);

    expect(values).toEqual(["20", "10", "15", "12"]);
  });
});
