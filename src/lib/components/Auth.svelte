<script lang="ts">
    import { supabase, sessionData } from "$lib/supabase.svelte";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state<string | null>(null);

    async function handleDiscordSignIn() {
        try {
            loading = true;
            error = null;
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: "discord",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (signInError) throw signInError;
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e.message;
            }
        } finally {
            loading = false;
        }
    }

    async function handleSignIn() {
        try {
            loading = true;
            error = null;
            const { data, error: signInError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

            if (signInError) throw signInError;

            sessionData.user = data.user;
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e.message;
            }
        } finally {
            loading = false;
        }
    }

    async function handleSignUp() {
        try {
            loading = true;
            error = null;
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;

            sessionData.user = data.user;
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e.message;
            }
        } finally {
            loading = false;
        }
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        sessionData.user = null;
    }
</script>

<div class="auth-container">
    {#if sessionData.user}
        <div>
            <p>Welcome, {sessionData.user.email}</p>
            <button onclick={handleSignOut}>Sign Out</button>
        </div>
    {:else}
        <form>
            <div class="social-login">
                <button
                    type="button"
                    onclick={handleDiscordSignIn}
                    disabled={loading}
                    class="discord-button"
                >
                    Sign in with Discord
                </button>
            </div>

            <div class="divider">
                <span>or</span>
            </div>
            <div>
                <label for="email">Email</label>
                <input id="email" type="email" bind:value={email} required />
            </div>

            <div>
                <label for="password">Password</label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    required
                />
            </div>

            {#if error}
                <div class="error">
                    {error}
                </div>
            {/if}

            <div class="buttons">
                <button type="button" onclick={handleSignIn} disabled={loading}>
                    Sign In
                </button>
                <button type="button" onclick={handleSignUp} disabled={loading}>
                    Sign Up
                </button>
            </div>
        </form>
    {/if}
</div>

<style>
    .auth-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
    }

    .error {
        color: red;
        margin: 10px 0;
    }

    .buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }

    .social-login {
        margin-bottom: 20px;
    }

    .discord-button {
        width: 100%;
        background-color: #5865f2;
        color: white;
    }

    .divider {
        text-align: center;
        margin: 20px 0;
        position: relative;
    }

    .divider::before,
    .divider::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 45%;
        height: 1px;
        background-color: #ccc;
    }

    .divider::before {
        left: 0;
    }

    .divider::after {
        right: 0;
    }

    .divider span {
        background-color: white;
        padding: 0 10px;
        color: #666;
    }
</style>
