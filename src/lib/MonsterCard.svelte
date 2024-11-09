<script lang="ts">
    import { type Monster, type Family } from "$lib/types.svelte";

    export let monster: Monster;
    export let family: Family;
    export let standaloneView: boolean = true;
</script>

<article>
    <header>
        <div>
            <span class="monster-name">{monster.name}</span>
            <span class="level">Lvl {monster.level}</span>
        </div>
        <div class="corestat">
            {#if monster.armor}
                <span id="armor">
                    <svg viewBox="-5.0 -10.0 110.0 135.0">
                        <path
                            d="m37.254 22.156c1.4531 0 2.6328 1.1836 2.6328 2.6367v0.003906c0 1.2812-0.91797 2.3516-2.1289 2.5898h-0.003906l-10 2.5977-0.050781 0.066406-0.015625 20.125c0 1.457-1.1836 2.6406-2.6406 2.6406s-2.6367-1.1836-2.6367-2.6406l0.015625-22.223c0-1.2031 0.8125-2.25 1.9766-2.5547l12.129-3.1445c0.22266-0.0625 0.45703-0.097656 0.69922-0.097656zm12.719-12.207c-0.22656 0-0.45312 0.027343-0.67969 0.085937l-33.117 8.5977c-1.1953 0.30859-2.0273 1.3867-2.0312 2.6211l-0.027343 40.688c0.23828 3.4102 0.69531 7.0156 6.9609 11.852l0.003906 0.003906c5.7617 4.4453 16.895 10.285 27.641 15.934 0.40234 0.21094 0.83203 0.30859 1.2578 0.30859l0.035156 0.003907c0.42578-0.003907 0.85938-0.10156 1.2578-0.3125 10.746-5.6484 21.848-11.469 27.609-15.91l0.03125-0.023437c6.2695-4.8359 6.7305-8.4453 6.9648-11.855l-0.027344-40.688c-0.003906-1.2344-0.83594-2.3125-2.0273-2.6211l-33.117-8.5938c-0.23047-0.0625-0.45703-0.089843-0.68359-0.089843z"
                        />
                    </svg>
                    {monster.armor}
                </span>
            {/if}
            {#if monster.swim}
                <span id="swim">
                    <svg viewBox="-5.0 -10.0 110.0 135.0">
                        <path
                            d="m68.25 52.41c-0.71875 1.5781-0.51172 3.3203 0.55078 4.6602 1.5781 1.9883 3.3086 3.0781 5.1406 3.25 4.7891 0.44141 12.18-0.64062 17.238-5.1211 3.6797-3.2617 5.6289-7.8594 5.8008-13.68 0.26953-9.0195-2.2891-16.57-7.4102-21.84-5.7305-5.8984-14.391-8.8906-25.738-8.8906-23.68 0-34.93 19.891-42.801 39.352-5.5703 13.762-13.512 28.391-17.75 35.898-0.37891 0.67188-0.37109 1.4609 0.011719 2.1289 0.39062 0.66016 1.0781 1.0586 1.8398 1.0586h85.379c1.1914 0 1.8516-0.82812 2.0508-1.5508 0.19922-0.71094 0.078125-1.7695-0.92969-2.3984-11.352-7.0586-30.559-20.789-31.781-33.379-0.39844-4.1016 1.1406-7.8008 4.5586-10.98 4.0508-3.1406 9.5391-3.8086 12.551-1.5508 2.0586 1.5586 2.5312 4.2305 1.2891 7.3203-0.76953 1.9219-2.8398 2.9609-6.1406 3.1016-1.7109 0.070313-3.1484 1.0586-3.8711 2.6289z"
                        />
                    </svg>
                    {monster.swim}
                </span>
            {/if}
            {#if monster.fly}
                <span id="fly">
                    <svg viewBox="0 0 100 125">
                        <path
                            d="M65.2,44.1c-1.4,0.5-3-0.2-3.6-1.6c-0.6-1.4,0.2-3,1.6-3.6c10.4-4,17.2-9.7,20.4-17.1c2.8-6.6,2.4-13.5,0.9-19.3    C76,16,55.9,27,37.3,36.5C22.5,44,13.5,56.1,14.4,67.3c1,11.9,12.9,22,33.6,28.5c8.1,2.5,13.9,2.2,17.3-0.9c4.3-3.9,4.5-12,3.9-17    c-3.7,1.3-7.9,2.5-12.7,3.4c-0.2,0-0.4,0.1-0.5,0.1c-1.3,0-2.5-0.9-2.7-2.2c-0.3-1.5,0.7-3,2.2-3.2C73.2,72.5,78.8,67,80.3,63    c1.1-2.8,0.5-5.5-0.3-7.2c-4.2,2.6-9.7,4.8-16.4,6.5c-0.2,0.1-0.5,0.1-0.7,0.1c-1.2,0-2.4-0.8-2.7-2.1c-0.4-1.5,0.5-3,2-3.4    c12.6-3.2,20.3-8,22.2-13.8C85.8,39,84,35.1,82.7,33C78.4,37.5,72.5,41.2,65.2,44.1z"
                        />
                    </svg>
                    {monster.fly}
                </span>
            {/if}
            {#if monster.speed}
                <span id="speed">
                    <svg viewBox="0 0 100 125"
                        ><path d="M4.56,13.12h0Z" /><path
                            d="M0,13,37,50,0,86.94q11.51-.07,23-.07L59.9,50,23.14,13.23q-9.29,0-18.58-.11h0C5,13.12,2.72,13.07,0,13Z"
                        /><path
                            d="M40.34,13.25,77.09,50,40.18,86.89q7.44,0,14.88.11c-1.1,0,3.86-.09,8,0l37-37L63.16,13.15C55.55,13.22,48,13.24,40.34,13.25Z"
                        />
                    </svg>
                    {monster.speed}
                </span>
            {/if}
            <span id="hp">
                <svg viewBox="-5.0 -10.0 110.0 135.0">
                    <path
                        d="m33.137 11.328h-0.003907c-11.852 0-21.559 9.3164-22.129 21.027v0.003906c-0.61328 14.234 5.9141 30.168 18.223 42.477 5.9023 5.9023 12.625 10.473 19.605 13.566l0.007813 0.003906c0.35156 0.16406 0.74219 0.25781 1.1562 0.25781 0.38281 0 0.75-0.078124 1.0781-0.22266h0.003906c7.0078-3.0977 13.77-7.6836 19.691-13.605 12.309-12.309 18.836-28.242 18.223-42.477-0.57031-11.715-10.281-21.031-22.133-21.031-6.7539 0-12.805 3.0273-16.859 7.7969v0.003906c-4.0586-4.7734-10.109-7.8008-16.863-7.8008z"
                    />
                </svg>
                {monster.hp}
            </span>
        </div>
    </header>
    {#if standaloneView && family.ability}
        <p class="ability">
            <strong>{family.ability.name}.</strong>
            {family.ability.description}
            (<a href="/f/{family.slug}">{family.name}</a>)
        </p>
    {/if}
    {#each monster.abilities as ability (ability.name)}
        <p class="ability">
            <strong>{ability.name}.</strong>
            {ability.description}
        </p>
    {/each}
    {#each monster.actions as action (action.name)}
        <p class="attack">
            <strong>{action.name}.</strong>
            <span class="damage"
                >{action.damage}{#if action.description}.{/if}</span
            >
            {#if action.description}
                <span class="description">{action.description}</span>
            {/if}
            {#if action.range}
                <span class="range">({action.range} ft)</span>
            {/if}
        </p>
    {/each}
    {#if monster.contributor}
        <p class="attribution">
            Contributed by <strong>{monster.contributor}</strong>
        </p>
    {/if}
</article>

<style>
    article {
        display: flex;
        flex-direction: column;
    }
    header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        font-weight: bold;
        align-items: flex-start;
    }
    .monster-name {
        font-size: 32px;
        font-weight: bold;
    }
    .level {
        font-size: 16px;
        margin-left: 10px;
        font-weight: normal;
        font-variant: small-caps;
    }
    .corestat {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
    }
    .corestat span {
        display: flex;
        justify-content: center;
        margin: auto 5px;
    }
    #speed svg {
        width: 18px;
        height: 23px;
        margin: 4px 3px 0 0;
    }
    #speed {
        height: 32px;
        margin-left: 14px;
    }
    .corestat svg {
        display: flex;
        width: 32px;
        height: 32px;
        margin-left: 5px;
        fill: var(--pico-color);
    }

    .ability {
        font-style: italic;
    }

    .attribution {
        margin-top: 25px;
        font-style: italic;
        font-size: 14px;
    }
</style>
