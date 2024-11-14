<script lang="ts">
    import { type Monster, type Family } from "$lib/types.svelte";
    import MonsterCard from "$lib/MonsterCard.svelte";
    import { page } from "$app/stores";

    const from = $page.url.searchParams.get("from");
    const { data } = $props();
    // let monster: Monster = $state({ actions: [], abilities: [] });
    // let monster: Monster = $state(data.families[0].monsters[0]);
    let family = data.families.find((f: Family) => {
        return f.monsters?.find((m: Monster) => from == m.slug);
    });
    let found = family?.monsters.find((m: Monster) => from == m.slug);
    let monster = $state(structuredClone(found));

    let addAbility = () =>
        monster.abilities.push({ name: "", description: "" });
    let addAction = () =>
        monster.actions.push({
            name: "",
            damage: "",
            range: "",
            description: "",
        });
</script>

<div class="wrap">
    <div class="form">
        <div class="row">
            <label>
                <input
                    name="name"
                    bind:value={monster.name}
                    autocomplete="off"
                    placeholder="Name"
                />
            </label>
            <label>
                Lvl
                <input
                    bind:value={monster.level}
                    name="name"
                    autocomplete="off"
                    placeholder="1/2"
                />
            </label>
            <label>
                <input
                    type="number"
                    bind:value={monster.hp}
                    name="name"
                    autocomplete="off"
                    placeholder="HP"
                />
            </label>
            <label>
                <select name="armor" bind:value={monster.armor}>
                    {#each [{ value: "", label: "Unarmored" }, { value: "M", label: "Medium" }, { value: "H", label: "Heavy" }] as { value, label }}
                        <option {value}>{label}</option>
                    {/each}
                </select>
            </label>
        </div>
        <fieldset>
            <legend>Abilities</legend>
            <div>
                <button id="add-ability" onclick={addAbility}>[+]</button>
            </div>
            {#each monster.abilities as ability, i}
                <fieldset class="row">
                    <label>
                        <input
                            bind:value={ability.name}
                            name="name"
                            autocomplete="off"
                            placeholder="Name"
                        />
                    </label>
                    <label class="description">
                        <input
                            bind:value={ability.description}
                            name="description"
                            autocomplete="off"
                            placeholder="Description"
                        />
                    </label>
                </fieldset>
            {/each}
        </fieldset>
        <fieldset>
            <legend>Actions</legend>
            <div>
                <button id="add-action" onclick={addAction}>[+]</button>
            </div>
            {#each monster.actions as action, i (action.name)}
                <fieldset class="row">
                    <label>
                        <input
                            bind:value={monster.actions[i].name}
                            name="name"
                            autocomplete="off"
                            placeholder="Name"
                        />
                    </label>
                    <label>
                        <input
                            bind:value={monster.actions[i].damage}
                            name="damage"
                            autocomplete="off"
                            placeholder="1d4+2"
                        />
                    </label>
                    <label class="description">
                        <input
                            bind:value={monster.actions[i].description}
                            name="description"
                            autocomplete="off"
                            placeholder="Description"
                        />
                    </label>
                </fieldset>
            {/each}
        </fieldset>
    </div>
    <MonsterCard
        family={data.families[0]}
        {monster}
        legendary={false}
        standaloneView={false}
    />
</div>

<style>
    div.wrap {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
    }

    div.form {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding-left: 2rem;
        padding-right: 2rem;
    }

    div.row {
        display: flex;
        flex-direction: row;
        label {
            display: flex;
            flex-direction: row;
            margin: 0.5rem;
        }
    }

    input {
        height: 1.5rem;
        width: 80%;
        margin: 0.5rem;
    }

    fieldset {
        margin: 1rem 0.5rem;
        padding: 0.5rem;
        border: 0;
        .row {
            display: flex;
            flex-direction: row;
            margin: 0;
        }
    }

    fieldset fieldset {
        margin: 0rem 0.5rem;
        padding: 0.5rem;
        border: 0;
        input {
            margin: 0;
        }
        label {
            margin: 0;
            padding: 0;
        }
    }

    fieldset legend {
        display: flex;
        flex-direction: column;
        font-weight: bold;
    }

    label {
        display: flex;
        flex-direction: column;
        margin: 0.5rem;
        padding: 0;
    }
    .description {
        flex-grow: 1;
    }
</style>
