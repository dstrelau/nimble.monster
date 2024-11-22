<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    onMount(() => {
        // Redirect to home page or dashboard after successful auth
        goto("/");
    });
</script>

<div>Processing login...</div>
