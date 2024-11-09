<script lang="ts">
    import MonsterCard from "$lib/MonsterCard.svelte";
    const { data } = $props();
    const { family, monsters } = $derived(data);
</script>

<h2>{family.name}</h2>
<div>
    {#if family.ability}
        <p class="ability">
            <strong>{family.ability.name}.</strong>
            {family.ability.description}
        </p>
    {/if}

    {#each data.monsters as monster}
        <MonsterCard {family} {monster} standaloneView={false} />
    {/each}
</div>

<style>
    .ability {
        font-style: italic;
        padding-left: var(--pico-block-spacing-horizontal);
        padding-right: var(--pico-block-spacing-horizontal);
        padding-bottom: var(--pico-block-spacing-vertical);
    }
    h2 {
        padding: 0 var(--pico-block-spacing-horizontal)
            var(--pico-block-spacing-vertical)
            var(--pico-block-spacing-vertical);
    }
</style>
