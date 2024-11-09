<script lang="ts">
    import "@picocss/pico";
    import { page } from "$app/stores";
    import { type Family, type Monster } from "$lib/types.svelte";

    const COLLATE_FAMILIES = "Families";
    const COLLATE_MONSTERS_BY_LEVEL = "Monsters by Level";
    const COLLATE_MONSTERS_BY_NAME = "Monsters by Name";

    let { data, children } = $props();
    let collate = $state("Families");
    function build() {
        function allMonstersBy(f: (m: Monster) => string): {
            [key: string]: Monster[];
        } {
            let allMonsters = data.families.flatMap((f: Family) => f.monsters);
            let monstersBy: { [key: string]: Monster[] } = {};
            allMonsters.forEach((m: Monster) => {
                const key = f(m);
                if (!monstersBy[key]) {
                    monstersBy[key] = [];
                }
                monstersBy[key].push(m);
            });
            return monstersBy;
        }
        switch (collate) {
            case COLLATE_MONSTERS_BY_NAME:
                let allByFirstLetter = allMonstersBy((m: Monster) =>
                    m.name[0].toUpperCase(),
                );
                return Object.entries(allByFirstLetter)
                    .sort(([a], [b]) => (a > b ? 1 : -1))
                    .map(([letter, monsters]) => ({
                        header: letter,
                        monsters: monsters,
                    }));
            case COLLATE_FAMILIES:
                return data.families.map((family: Family) => ({
                    header: family.name,
                    monsters: family.monsters,
                }));
            case COLLATE_MONSTERS_BY_LEVEL:
                const allByLevel = allMonstersBy((m: Monster) => m.level);
                return Object.entries(allByLevel)
                    .sort(([a], [b]) => {
                        const parseLevel = (lvl: string) => {
                            if (lvl.includes("/")) {
                                const [num, denom] = lvl.split("/");
                                return Number(num) / Number(denom);
                            }
                            return Number(lvl);
                        };
                        return parseLevel(a) - parseLevel(b);
                    })
                    .map(([lvl, monsters]) => ({
                        header: lvl,
                        monsters: monsters,
                    }));
        }
    }
    let toc = $derived.by(build);
</script>

<div class="wrap">
    <header>
        <h1>Nimble Bestiary</h1>
    </header>
    <div class="container">
        <aside>
            <select name="collate" bind:value={collate}>
                <option selected>{COLLATE_FAMILIES}</option>
                <option selected>{COLLATE_MONSTERS_BY_NAME}</option>
                <option selected>{COLLATE_MONSTERS_BY_LEVEL}</option>
            </select>
            <nav>
                {#if collate == COLLATE_FAMILIES}
                    <ul>
                        {#each data.families as fam (fam.slug)}
                            <li>
                                <a
                                    href="/f/{fam.slug}"
                                    aria-current={$page.url.pathname ===
                                        `/f/${fam.slug}`}
                                >
                                    {fam.name}
                                </a>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    {#each toc as { header, monsters } (header)}
                        <summary>{header}</summary>
                        <ul>
                            {#each monsters as monster (monster.slug)}
                                <li>
                                    <a
                                        href="/m/{monster.slug}"
                                        aria-current={$page.url.pathname ===
                                            `/m/${monster.slug}`}
                                    >
                                        {monster.name}
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    {/each}
                {/if}
                <!-- <ul>
                    <li>
                        <a href="/_dice">Dice Roller</a>
                    </li>
                </ul> -->
            </nav>
        </aside>
        <div class="detail">
            {@render children()}
        </div>
    </div>
</div>

<style>
    :root {
        --pico-typography-spacing-vertical: 0.5rem;
        --pico-nav-element-spacing-vertical: 0.1rem;
    }

    /* override style meant for horizontal nav, which we don't have */
    nav ul:first-of-type {
        /* margin-left:calc(var(--pico-nav-element-spacing-horizontal) * -1) */
        margin-left: 0;
    }

    .wrap {
        margin: 5px auto;
        max-width: 1200px;
    }
    header {
        padding-left: 5px;
        padding-right: 5px;
    }
    .container {
        display: flex;
        flex-direction: row;
        justify-content: baseline;
        align-items: stretch;
    }
    .detail {
        flex-grow: 4;
        max-width: 70%;
        margin-left: 25px;
    }
    aside {
        flex-grow: 1;
        padding-left: 5px;
        padding-right: 5px;
    }
    aside select {
        margin-bottom: 0;
    }

    nav summary {
        margin-top: 0.5rem;
    }
</style>
