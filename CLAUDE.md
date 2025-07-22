# Build Commands
- `pnpm run check` - Lint and type-check (dev-safe, use this during development)
- `pnpm run lint` - ESLint only
- `pnpm run type-check` - TypeScript check only
- `pnpm run build` - Production build (breaks dev server, requires `rm -rf .next && pnpm run dev` after)
- Regenerate lib/prisma from schema: `pnpm prisma generate`
- the dev server runs on localhost:3000 and can be accessed via playwright

**Note:** `pnpm run build` creates production cache in `.next` that conflicts with the dev server. Use `pnpm run check` during development instead.

# Code Style

## TypeScript/React
- Prefer SSR when possible
- Use the latest Next.js built-in features over external libraries
- Type all props and state with TypeScript interfaces
- Do NOT use "as Type" constructs to bypass type checking. EVER.
- Organize imports: React/libraries first, then components, then contexts/types
- File structure: components/, views/, lib/ directories
- Use tailwind and daisyUI for styling
- In this version of Next.js, params are a Promise that need to be awaited.
- Use OpenTelemetry.
- Do not add console.* functions permanently (they may be used for temporary debugging).
- Use clsx for constructing className
- Use lucide icons instead of custom SVGs

# Claude Instructions
- If there is ambiguity in my questions or instructions, please ask for clarification.
- Be as terse as possible, only doing what is asked.
- Do not be overly enthusiastic or ingratiating. Treat me as an equal.
- We use version control, so you may delete files without backup when necessary.
- Do not add unnecessary comments or explanations.
- Do not add logging unless specifically requested.
