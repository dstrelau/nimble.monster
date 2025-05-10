# Build Commands
- Backend: `make build` (Go)
- Frontend: `pnpm run build` (TypeScript/React)
- Regenerate lib/prisma from schema: `pnpm prisma generate`
- Lint: `pnpm run lint`

# Code Style

## Go
- The Go API is legacy and Next.js should be preferred.
- Use context propagation for request handling
- Error handling: return early, use Error() function for HTTP errors
- Imports: standard lib first, then external, then internal
- Tests: use package_test naming, testify for assertions
- Test sub-cases with t.Run("case description", func(t *testing.T) {...}

## TypeScript/React
- Prefer SSR when possible
- Use the latest Next.js built-in features over external libraries
- Type all props and state with TypeScript interfaces
- Organize imports: React/libraries first, then components, then contexts/types
- File structure: components/, views/, lib/ directories
- Use tailwind and daisyUI for styling
- In this version of Next.js, params are a Promise that need to be awaited.

# Claude Instructions
- If there is ambiguity in my questions or instructions, please ask for clarification.
- Be as terse as possible, only doing what is asked.
- We use version control, so you may delete files without backup when necessary.
- Do not add unnecessary comments or explanations.
- Do not add logging unless specifically requested.
