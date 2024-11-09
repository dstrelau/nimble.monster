<script lang="ts">
    import MonsterCard from "$lib/MonsterCard.svelte";
    let { data } = $props();
    const monster = $derived(data.selected);
    const family = $derived(data.family);
</script>

<MonsterCard {monster} {family} />
