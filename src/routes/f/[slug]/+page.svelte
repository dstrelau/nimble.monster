<script lang="ts">
    import MonsterCard from "$lib/MonsterCard.svelte";
    const { data } = $props();
    const { family } = $derived(data);
    const legendary = $derived(family.slug == "legendary-monsters");
</script>

<h2>{family.name}</h2>
<div class:legendary>
    {#if family.ability}
        <p class="ability">
            <strong>{family.ability.name}.</strong>
            {family.ability.description}
        </p>
    {/if}

    {#each data.monsters as monster}
        <MonsterCard {family} {monster} {legendary} standaloneView={false} />
    {/each}
</div>

<style>
    :global(.ability) {
        font-style: italic;
        background-color: var(--nimble-fill);
        padding: 0.25rem 0.5rem;
        text-align: center;
    }

    div {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }
    .ability {
        background-color: var(--nimble-fill);
        padding: 0.25rem 0.5rem;
        grid-column: 1 / -1;
        text-align: center;
    }
    h2 {
        font-family: "beaufort-pro", serif;
        font-weight: 900;
        font-size: 2rem;
        margin: 0 0;
        grid-column: 1 / -1;
    }
    .legendary {
        grid-template-columns: 1fr;
        grid-column: 1 / -1;
    }
</style>
