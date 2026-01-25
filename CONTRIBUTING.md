# Contributing to Nimble Nexus

## Prerequisites

- Node.js 24+
- pnpm 10.11.0+

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Generate an auth secret:

```bash
pnpx auth secret
```

For authentication, you'll need Discord OAuth credentials:

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to OAuth2 in the sidebar
4. Copy the **Client ID** and **Client Secret** to your `.env` file
5. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`

```bash
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"
```

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. Start Development Server

```bash
pnpm run dev
```

The app will be available at http://localhost:3000.

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run check` | Run linting and type-check (use during development) |
| `pnpm run lint` | Run Biome linter only |
| `pnpm run lint --fix` | Auto-fix lint issues |
| `pnpm run type-check` | Run TypeScript type-check only |
| `pnpm run test` | Run tests |
| `pnpm run build` | Production build (avoid during dev - breaks dev server) |

## Code Style

- Use TypeScript with proper typing (avoid `as` type assertions)
- Use Tailwind CSS and shadcn/ui for styling
- Prefer server-side rendering (SSR) when possible
- Use `cn()` from `lib/utils.ts` for dynamic classNames
- Use lucide-react for icons
- Organize imports: React/libraries first, then components, then contexts/types

## Adding shadcn Components

```bash
pnpx shadcn@latest add <component>
```

## Database Changes

After modifying `lib/db/schema.ts`:

```bash
pnpm db:generate
pnpm db:migrate
```

## Running Without Discord Auth

You can browse the app without Discord credentials configured - you just won't be able to log in or create/edit content.
