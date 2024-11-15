<script lang="ts">
    import { type Monster, type Family, type Ability } from "$lib/types.svelte";
    import MonsterCard from "$lib/MonsterCard.svelte";
    import { page } from "$app/stores";

    const from = $page.url.searchParams.get("from");
    const { data } = $props();
    let family = data.families.find((f: Family) => {
        return f.monsters?.find((m: Monster) => from == m.slug);
    });
    let found = family?.monsters.find((m: Monster) => from == m.slug);
    let monster = $state(structuredClone(found || {}));

    let addAbility = () =>
        monster.abilities.push({ name: "", description: "" });
    let removeAbility = (i: number) => {
        monster.abilities.splice(i, 1);
    };
    let addAction = () =>
        monster.actions.push({
            name: "",
            damage: "",
            range: "",
            description: "",
        });
    let removeAction = (i: number) => monster.actions.splice(i, 1);
</script>

<div class="wrap">
    <div class="form">
        <div class="row">
            <label style="flex-grow:1; padding-right: 5rem;">
                Name
                <input
                    name="name"
                    bind:value={monster.name}
                    autocomplete="off"
                    placeholder="Owlbear"
                />
            </label>
            <label>
                Lvl
                <input
                    class="number"
                    bind:value={monster.level}
                    name="name"
                    autocomplete="off"
                    placeholder="1/2"
                />
            </label>
        </div>
        <div class="row">
            <label>
                Armor
                <select name="armor" bind:value={monster.armor}>
                    {#each [{ value: "", label: "Unarmored" }, { value: "M", label: "Medium" }, { value: "H", label: "Heavy" }] as { value, label }}
                        <option {value}>{label}</option>
                    {/each}
                </select>
            </label>
            <label>
                Swim
                <input
                    type="number"
                    bind:value={monster.swim}
                    name="name"
                    autocomplete="off"
                    placeholder=""
                />
            </label>
            <label>
                Fly
                <input
                    type="number"
                    bind:value={monster.fly}
                    name="name"
                    autocomplete="off"
                    placeholder=""
                />
            </label>
            <label>
                Speed
                <input
                    type="number"
                    bind:value={monster.speed}
                    name="speed"
                    autocomplete="off"
                    placeholder=""
                />
            </label>
            <label>
                HP
                <input
                    type="number"
                    bind:value={monster.hp}
                    name="name"
                    autocomplete="off"
                    placeholder="67"
                />
            </label>
        </div>
        <fieldset>
            <div class="header">
                <legend>Abilities</legend>
                <button onclick={addAbility}>
                    <svg
                        viewBox="-5.0 -10.0 110.0 135.0"
                        aria-labelledby="add-ability"
                        focusable="false"
                    >
                        <title id="add-ability">Add Ability</title>
                        <path
                            d="m50 3.9844c25.414 0 46.016 20.602 46.016 46.016s-20.602 46.016-46.016 46.016c-25.41 0-46.016-20.602-46.016-46.016 0-25.41 20.605-46.016 46.016-46.016zm-16.891 42.07v7.8906h12.945v12.945h7.8906v-12.945h12.945v-7.8906h-12.945v-12.945h-7.8906v12.945zm43.852-23.016c-14.891-14.891-39.031-14.891-53.922 0-14.891 14.891-14.891 39.031 0 53.922 14.891 14.891 39.031 14.891 53.922 0 14.891-14.891 14.891-39.031 0-53.922z"
                            fill-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>
            {#each monster?.abilities as ability, i (i)}
                <fieldset class="row">
                    <label>
                        Name
                        <input
                            bind:value={ability.name}
                            name="ability.name"
                            autocomplete="off"
                            placeholder="Vicious"
                        />
                    </label>
                    <label class="description">
                        Description
                        <input
                            bind:value={ability.description}
                            name="ability.description"
                            autocomplete="off"
                            placeholder="On crit, roll an additional die for each explosion."
                        />
                    </label>
                    <button onclick={() => removeAbility(i)}>
                        <svg
                            viewBox="-5.0 -10.0 110.0 135.0"
                            aria-labelledby="remove-ability"
                            focusable="false"
                        >
                            <title id="remove-ability">Remove Ability</title>
                            <path
                                d="m50 3.9844c25.414 0 46.016 20.602 46.016 46.016s-20.602 46.016-46.016 46.016-46.016-20.602-46.016-46.016c0-25.41 20.602-46.016 46.016-46.016zm20.387 49.961v-7.8906h-40.777v7.8906zm17.738-3.9453c0-21.059-17.07-38.129-38.129-38.129-21.051 0-38.125 17.07-38.125 38.129s17.07 38.129 38.129 38.129 38.129-17.07 38.129-38.129z"
                                fill-rule="evenodd"
                            />
                        </svg>
                    </button>
                </fieldset>
            {/each}
        </fieldset>
        <fieldset>
            <div class="header">
                <legend>Actions</legend>
                <button onclick={addAction}>
                    <svg
                        viewBox="-5.0 -10.0 110.0 135.0"
                        aria-labelledby="add-action"
                        focusable="false"
                    >
                        <title id="add-action">Add Action</title>
                        <path
                            d="m50 3.9844c25.414 0 46.016 20.602 46.016 46.016s-20.602 46.016-46.016 46.016c-25.41 0-46.016-20.602-46.016-46.016 0-25.41 20.605-46.016 46.016-46.016zm-16.891 42.07v7.8906h12.945v12.945h7.8906v-12.945h12.945v-7.8906h-12.945v-12.945h-7.8906v12.945zm43.852-23.016c-14.891-14.891-39.031-14.891-53.922 0-14.891 14.891-14.891 39.031 0 53.922 14.891 14.891 39.031 14.891 53.922 0 14.891-14.891 14.891-39.031 0-53.922z"
                            fill-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>
            {#each monster?.actions as action, i (action.name)}
                <fieldset>
                    <div class="row">
                        <label>
                            Name
                            <input
                                bind:value={monster.actions[i].name}
                                name="name"
                                autocomplete="off"
                                placeholder="Name"
                            />
                        </label>
                        <label>
                            Damage
                            <input
                                bind:value={monster.actions[i].damage}
                                name="damage"
                                autocomplete="off"
                                placeholder="1d4+2"
                            />
                        </label>
                        <button onclick={() => removeAction(i)}>
                            <svg
                                viewBox="-5.0 -10.0 110.0 135.0"
                                aria-labelledby="remove-action"
                                focusable="false"
                            >
                                <title id="remove-action">Remove Action</title>
                                <path
                                    d="m50 3.9844c25.414 0 46.016 20.602 46.016 46.016s-20.602 46.016-46.016 46.016-46.016-20.602-46.016-46.016c0-25.41 20.602-46.016 46.016-46.016zm20.387 49.961v-7.8906h-40.777v7.8906zm17.738-3.9453c0-21.059-17.07-38.129-38.129-38.129-21.051 0-38.125 17.07-38.125 38.129s17.07 38.129 38.129 38.129 38.129-17.07 38.129-38.129z"
                                    fill-rule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="row">
                        <label class="description">
                            Description
                            <input
                                bind:value={monster.actions[i].description}
                                name="description"
                                autocomplete="off"
                                placeholder="Description"
                            />
                        </label>
                    </div>
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

    .form {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding-right: 2rem;
    }

    .row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .header {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
    }
    .header svg {
        top: -0.25em;
    }

    select,
    input {
        font-size: 14px;
        border-radius: 6px;
        line-height: 1.5;
        margin-top: 0.25rem;
        margin-bottom: 0.25rem;
        padding: 0.25rem 0.5rem;
        border: 2px solid #dee1e2;
        color: var(--nimble-color-black);
        background: var(--nimble-color-lighter);
        display: block;
        height: 2rem;
    }

    input[type="number"],
    input.number {
        width: 3rem;
    }

    fieldset {
        margin: 1rem 0rem;
        padding: 0.5rem;
        border: 0;
        .row {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            justify-content: space-between;
            margin: 0;
        }
    }

    fieldset fieldset {
        margin: 0;
        padding: 0;
        border: 0;
        /* input {
            margin: 0.25rem;
        } */
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

    button {
        font-size: 1.25em;
        font-weight: bold;
        line-height: 0.5rem;
        position: relative;
        border: 0;
        color: var(--nimble-color-dark);
        background: transparent;
        border-radius: 0.125em;
        transition: background 0.3s;

        &:hover,
        &:focus {
            color: var(--nimble-color-darker);
        }

        &:active {
            top: 0.08em;
        }
    }

    svg {
        position: relative;
        top: 0.5em;
        flex-shrink: 0;
        height: 1.5em;
        width: 1.5em;
        fill: currentColor;
        cursor: pointer;
    }
</style>
