# Build Commands
- `pnpm run build` (TypeScript/React)
- Regenerate lib/prisma from schema: `pnpm prisma generate`
- Lint: `pnpm run lint`
  - Don't modify the tailwind config file for lint errors.

# Code Style

## TypeScript/React
- Prefer SSR when possible
- Use the latest Next.js built-in features over external libraries
- Type all props and state with TypeScript interfaces
- Do not use "as Type" constructs to bypass type checking.
- Organize imports: React/libraries first, then components, then contexts/types
- File structure: components/, views/, lib/ directories
- Use tailwind and daisyUI for styling
- In this version of Next.js, params are a Promise that need to be awaited.
- Use OpenTelemetry.
- Do not add console.* functions permanently (they may be used for temporary debugging).
- Use clsx for constructing className

# Claude Instructions
- If there is ambiguity in my questions or instructions, please ask for clarification.
- Be as terse as possible, only doing what is asked.
- We use version control, so you may delete files without backup when necessary.
- Do not add unnecessary comments or explanations.
- Do not add logging unless specifically requested.