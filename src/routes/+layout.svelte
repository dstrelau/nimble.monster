<script lang="ts">
    import "@picocss/pico";
    import { page } from "$app/stores";

    let { data, children } = $props();
    function slugify(s: string) {
        return s
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "");
    }
</script>

<div class="wrap">
    <header>
        <h1>Nimble Bestiary</h1>
    </header>
    <div class="container">
        <aside>
            <nav>
                {#each data.families as family}
                    <details>
                        <summary>{family.name}</summary>
                        <ul>
                            {#each family.monsters as monster}
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
                    </details>
                {/each}
                <ul>
                    <li>
                        <a href="/_dice">Dice Roller</a>
                    </li>
                </ul>
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
        max-width: 900px;
        display: block;
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
        flex-grow: 2;
        max-width: 720px;
    }

    nav {
        overflow-y: auto;
        height: 100%;
        min-width: 20%;
    }

    nav ul {
        font-size: 15px;
        margin-left: 0;
    }
    nav li {
        padding-bottom: 0;
        font-size: 15px;
        margin-left: 0;
    }
    nav summary {
        margin-bottom: 0;
    }
</style>
