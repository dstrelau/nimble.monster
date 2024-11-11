<script lang="ts">
    // import "@picocss/pico";
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
    <h1>Nimble Bestiary</h1>
    <aside>
        <select name="collate" bind:value={collate}>
            <option selected>{COLLATE_FAMILIES}</option>
            <option selected>{COLLATE_MONSTERS_BY_NAME}</option>
            <option selected>{COLLATE_MONSTERS_BY_LEVEL}</option>
        </select>
        <nav>
            <ul>
                {#if collate == COLLATE_FAMILIES}
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
                {:else}
                    {#each toc as { header, monsters } (header)}
                        <li>
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
                        </li>
                    {/each}
                {/if}
            </ul>
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

<svelte:head>
    <style>
        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-Light.woff2") format("woff2"),
                url("Beaufort/Beaufort-Light.woff") format("woff");
            font-weight: 300;
            font-style: normal;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-Medium.woff2") format("woff2"),
                url("Beaufort/Beaufort-Medium.woff") format("woff");
            font-weight: 500;
            font-style: normal;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-BoldItalic.woff2") format("woff2"),
                url("Beaufort/Beaufort-BoldItalic.woff") format("woff");
            font-weight: bold;
            font-style: italic;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-Heavy.woff2") format("woff2"),
                url("Beaufort/Beaufort-Heavy.woff") format("woff");
            font-weight: 900;
            font-style: normal;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-MediumItalic.woff2") format("woff2"),
                url("Beaufort/Beaufort-MediumItalic.woff") format("woff");
            font-weight: 500;
            font-style: italic;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-HeavyItalic.woff2") format("woff2"),
                url("Beaufort/Beaufort-HeavyItalic.woff") format("woff"),
            font-weight: 900;
            font-style: italic;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-Italic.woff2") format("woff2"),
                url("Beaufort/Beaufort-Italic.woff") format("woff");
            font-weight: normal;
            font-style: italic;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-LightItalic.woff2") format("woff2"),
                url("Beaufort/Beaufort-LightItalic.woff") format("woff");
            font-weight: 300;
            font-style: italic;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-Regular.woff2") format("woff2"),
                url("Beaufort/Beaufort-Regular.woff") format("woff");
            font-weight: normal;
            font-style: normal;
        }

        @font-face {
            font-family: "Beaufort";
            src:
                url("Beaufort/Beaufort-Bold.woff2") format("woff2"),
                url("Beaufort/Beaufort-Bold.woff") format("woff");
            font-weight: bold;
            font-style: normal;
        }
    </style>
</svelte:head>

<style>
    :global(body) {
        font-family: "Roboto Condensed", sans-serif;
        font-weight: 300;
        background-color: #f5ebd7;
        --nimble-fill: #d2cebd;
    }
    .wrap {
        margin: 5px auto;
        max-width: 1200px;
        display: grid;
        grid-template-columns: 1fr 3fr;
    }

    h1 {
        font-size: 2rem;
        font-family: "beaufort-pro", serif;
        font-weight: 900;
        font-style: italic;
        text-transform: uppercase;
        padding-left: 5px;
        padding-right: 5px;
        font-weight: bold;
        grid-column: 1 / -1;
    }

    aside {
        padding-left: 5px;
        padding-right: 5px;
        grid-column: 1;
    }

    aside select {
        margin-bottom: 0;
    }

    nav ul,
    nav li {
        font-weight: bold;
        margin: 0;
        padding: 0;
        text-indent: 0;
        list-style: none;
    }
    nav li {
        margin-top: 0.5rem;
    }
    nav li li {
        font-weight: 300;
    }
    nav a {
        color: #000;
        text-decoration: none;
        &:hover {
            text-decoration: underline;
        }
    }
    [aria-current]:not([aria-current="false"]) {
        font-style: italic;
    }

    .detail {
        grid-column: 2;
    }
</style>
