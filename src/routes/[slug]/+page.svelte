<script lang="ts">
    let { data } = $props();
    const monster = $derived(data.selected);
    const family = $derived(data.family);

    function toArmor(armor: string) {
        switch (armor) {
            case "medium":
                return "M";
            case "heavy":
                return "H";
            default:
                return "";
        }
    }
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
                    {toArmor(monster.armor)}
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
                    {monster.speed || 30}
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
    {#if family.ability}
        <p class="family ability">
            <strong>{family.ability.name}.</strong>
            {family.ability.description}
        </p>
    {/if}
    {#each monster.abilities as ability}
        <p class="ability">
            <strong>{ability.name}.</strong>
            {ability.description}
        </p>
    {/each}
    {#each monster.attacks as attack}
        <p class="attack">
            <strong>{attack.name}.</strong>
            <span class="damage"
                >{attack.damage}{#if attack.description}.{/if}</span
            >
            {#if attack.description}
                <span class="description">{attack.description}</span>
            {/if}
            {#if attack.range}
                <span class="range">({attack.range} ft)</span>
            {/if}
        </p>
    {/each}
</article>

<style>
    article {
        display: flex;
        flex-direction: column;
        margin: 0 15px;
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
    .family {
        font-style: italic;
    }
</style>
