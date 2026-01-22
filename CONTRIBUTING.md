# Contributing to Nimble Monster

## Prerequisites

- Node.js
- pnpm 10.11.0+
- Docker (for running PostgreSQL locally)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL with Docker

```bash
docker compose up -d
```

This starts a PostgreSQL 16 database with the required uuid-ossp extension.

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

The default database connection is pre-configured to work with the Docker setup.

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

### 4. Run Database Migrations

```bash
pnpm prisma migrate deploy
```

### 5. Generate Prisma Client

```bash
pnpm prisma generate
```

### 6. Start Development Server

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

After modifying `prisma/schema.prisma`:

```bash
pnpm prisma migrate dev --name description_of_change
pnpm prisma generate
```

## Running Without Discord Auth

You can browse the app without Discord credentials configured - you just won't be able to log in or create/edit content.
