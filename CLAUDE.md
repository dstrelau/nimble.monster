# Build Commands
- `pnpm run check` - Lint and type-check (dev-safe, use this during development)
  - You must run this after making changes to ensure there are no type errors or lint errors.
- `pnpm run lint` - Biome check (linting, formatting, import sorting)
  - `--fix` can be added to automatically fix many issues
- `pnpm run type-check` - TypeScript check only
- `pnpm run build` - Production build (breaks dev server. Only run when asked. Always run `rm -rf .next` after.)
- `prisma/scehma.prisma` is the schema file.
  - lib/prisma is generated with `pnpm prisma generate`
- Assume the dev server is already running on localhost:3000 and can be accessed via playwright.
  - Do not ever run `pnpm run dev`

# Code Style
- Prefer SSR when possible
- Use the latest Next.js built-in features over external libraries
- Type all props and state with TypeScript interfaces
- Do NOT use "as Type" constructs to bypass type checking. EVER.
- Organize imports: React/libraries first, then components, then contexts/types
- File structure: components/, views/, lib/ directories
- Use tailwind and shadcn for styling
  - We are migrating from daisyui to shadcn
  - You may add new shadcn components as needed via `pnpx shadcn@latest add <component>`
  - Do not modify shadcn components in components/ui without explicit confirmation
- In this version of Next.js, params are a Promise that need to be awaited.
- Use OpenTelemetry.
- Do not add console.* functions permanently (they may be used for temporary debugging).
- Use clsx for constructing className
- Use lucide icons instead of custom SVGs

# Tests
- `pnpm run test` to run tests.
- When adding new functionality, make sure you add tests.
- Use @testing-library/react and vitest.
- Make sure to add cleanup after each test whenever necessary.
- When mocking dependencies, use the most narrow, specific mock possible.
