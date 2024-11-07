<script lang="ts">
    // import { page } from "$app/stores";
    import { browser } from "$app/environment";

    let q = "";
    if (browser) {
        const urlParams = new URLSearchParams(window.location.search);
        q = urlParams.get("roll") || "";
    }

    // let q = $page.url.searchParams.get("roll");
    let rollInput = $state(q || "");
    let rollOutput = $state(new Map<number, number>());
    if (q) {
        onclick();
    }

    function parseRollString(str: string) {
        const re = /(?:(\d) ?x ?)?(\d)d(\d)(?: ?\+ ?(\d))?/;
        let result = {
            multiplier: 1,
            count: 1,
            die: 0,
            bonus: 0,
        };

        const matches = str.match(re);

        if (matches) {
            result.multiplier = matches[1] ? parseInt(matches[1]) : 1;
            result.count = parseInt(matches[2]);
            result.die = parseInt(matches[3]);
            result.bonus = matches[4] ? parseInt(matches[4]) : 0;
        }

        return result;
    }

    function rollDie(count: number, die: number, bonus: number): number {
        const primary = Math.floor(Math.random() * die) + 1;
        // miss on 1
        if (primary == 1) {
            return 0;
        }
        // explode primary
        let total = primary;
        let explode = primary;
        for (var limit = 0; explode == die && limit < 5; limit++) {
            explode = Math.floor(Math.random() * die) + 1;
            total += explode;
        }
        // roll rest of dice
        for (let i = 0; i < count - 1; i++) {
            total += Math.floor(Math.random() * die) + 1;
        }
        return total + bonus;
    }

    function onclick() {
        let { multiplier, count, die, bonus } = parseRollString(rollInput);

        const samples = 1_000_000;
        let results: { [key: number]: number } = {};
        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < multiplier; j++) {
                let roll = rollDie(count, die, bonus);
                sum += roll;
            }
            results[sum] = (results[sum] || 0) + 1;
        }

        let output = new Map<number, number>();
        const maxValue = Math.max(...Object.keys(results).map(Number));
        for (let i = 0; i < maxValue; i++) {
            let v = results[i] || 0;
            let perc = v / samples;
            output.set(i, 100 * perc);
        }
        rollOutput = output;
    }
</script>

<div>
    <form>
        <fieldset role="group">
            <input
                name="roll"
                placeholder="1d8+2"
                aria-describedby="roll-help"
                bind:value={rollInput}
            />
            <input type="submit" value="Roll" {onclick} />
        </fieldset>
        <small id="roll-help">supported: 2d6, 3d4+2, 2x1d8+4</small>
    </form>

    {#if rollOutput.size > 0}
        <table>
            <thead>
                <tr><th>#</th><th>%</th><th></th></tr>
            </thead>
            <tbody>
                {#each rollOutput as [roll, perc]}
                    <tr>
                        <td>{roll}</td>
                        <td>{perc.toFixed(2)}</td>
                        <td style="width:100%">
                            <div class="bar" style="width:{perc}%;">&nbsp;</div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<style>
    form {
        margin: 0 50px;
    }
    td {
        padding-top: 0;
        padding-bottom: 0;
    }
    .bar {
        background-color: var(--pico-color);
    }
</style>
