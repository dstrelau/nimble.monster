<script lang="ts">
    import "@picocss/pico";
    import { page } from "$app/stores";
    import { type Family, type Monster } from "$lib/Bestiary.svelte.js";

    let { data, children } = $props();
    let collate = $state("By Name");
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
            case "By Name":
                let allByFirstLetter = allMonstersBy((m: Monster) =>
                    m.name[0].toUpperCase(),
                );
                return Object.entries(allByFirstLetter)
                    .sort(([a], [b]) => a > b)
                    .map(([letter, monsters]) => ({
                        header: letter,
                        monsters: monsters,
                    }));
            case "By Family":
                return data.families.map((family: Family) => ({
                    header: family.name,
                    monsters: family.monsters,
                }));
            case "By Level":
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
                <option selected>By Name</option>
                <option selected>By Family</option>
                <option selected>By Level</option>
            </select>
            <nav>
                {#each toc as { header, monsters }}
                    <summary>{header}</summary>
                    <ul>
                        {#each monsters as monster}
                            <li>
                                <a
                                    href="/{monster.slug}"
                                    aria-current={$page.url.pathname ===
                                        `/${monster.slug}`}
                                >
                                    {monster.name}
                                </a>
                            </li>
                        {/each}
                    </ul>
                {/each}
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
    .wrap {
        margin: 5px auto;
        max-width: 1200px;
    }
    header {
        padding: 5px 25px;
    }
    .container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: stretch;
    }
    .detail {
        flex-grow: 4;
        margin: auto 15px;
        max-width: 70%;
    }

    aside {
        overflow-y: auto;
        flex-grow: 1;
    }

    nav ul {
        font-size: 15px;
        margin-left: 0;
    }
    nav li {
        padding-bottom: 0;
        font-size: 20px;
        margin-left: 0;
    }
    nav summary {
        margin-bottom: 0;
    }
</style>
