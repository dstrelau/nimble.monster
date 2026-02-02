# End-to-End Testing Plan

## Executive Summary

This plan outlines the strategy for implementing end-to-end (E2E) tests for Nimble Nexus, focusing on critical user flows for browsing, searching, and interacting with D&D homebrew content. The tests will run locally against the dev server and in CI before deployment.

## Framework Choice: Playwright

### Why Playwright?

1. **Already installed** - Playwright v1.56.1 is already a dev dependency, reducing setup friction
2. **Modern architecture** - Auto-wait capabilities reduce flaky tests compared to alternatives
3. **Multi-browser support** - Test Chrome, Firefox, and Safari from the same codebase
4. **Built-in test runner** - No need for additional test framework integration
5. **Excellent Next.js support** - First-class support for SSR applications with proper hydration handling
6. **Network interception** - Can mock API responses for deterministic tests when needed
7. **Visual debugging** - Trace viewer and screenshot capture for debugging failures
8. **Parallel execution** - Tests run in parallel by default for faster CI times

### Alternative Considered: Cypress

Cypress was considered but rejected because:
- Playwright is already in the dependency tree
- Cypress requires a separate browser process model
- Playwright's auto-wait is more robust for React 19's concurrent rendering
- Playwright has better support for testing downloads (relevant for image export)

## Test Architecture

### Directory Structure

```
e2e/
├── fixtures/
│   ├── auth.ts          # Authentication helpers (mock Discord OAuth)
│   └── database.ts      # Test data seeding utilities
├── pages/
│   ├── home.ts          # Home page object
│   ├── monsters.ts      # Monster list page object
│   ├── monster-detail.ts # Monster detail page object
│   ├── items.ts         # Items list page object
│   └── item-detail.ts   # Item detail page object
├── tests/
│   ├── homepage.spec.ts
│   ├── monster-browse.spec.ts
│   ├── monster-detail.spec.ts
│   ├── item-browse.spec.ts
│   ├── item-detail.spec.ts
│   ├── search.spec.ts
│   └── share-download.spec.ts
└── playwright.config.ts
```

### Design Patterns

#### Page Object Model (POM)

Use page objects to encapsulate page-specific selectors and actions:

```typescript
// e2e/pages/monsters.ts
export class MonstersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/monsters');
  }

  async search(query: string) {
    await this.page.getByPlaceholder(/search/i).fill(query);
  }

  async getMonsterCards() {
    return this.page.locator('[data-testid="monster-card"]');
  }

  async selectTypeFilter(type: 'all' | 'standard' | 'legendary' | 'minion') {
    await this.page.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).click();
  }
}
```

**Rationale**: POM provides:
- Reusable code across tests
- Single point of maintenance when UI changes
- More readable test code

#### Fixtures for Test Setup

Use Playwright fixtures for common setup:

```typescript
// e2e/fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page, context }, use) => {
    // Set up mock authentication session
    await context.addCookies([/* mock session cookie */]);
    await use(page);
  },
});
```

**Rationale**: Fixtures allow:
- Consistent test setup
- Easy authentication mocking without hitting Discord OAuth
- Isolated test state

### Test Data Strategy

#### Option 1: Seed Database Before Tests (Recommended)

Create deterministic test data in SQLite before running tests:

```typescript
// e2e/fixtures/database.ts
export async function seedTestData() {
  // Use drizzle directly or an API endpoint
  // Create known monsters, items for testing
}
```

**Rationale**:
- Tests don't depend on production data
- Predictable assertions
- Tests can run in any environment

#### Option 2: Use Existing Public Data

For initial implementation, tests can use existing public content which is stable enough for happy-path testing. This is simpler but less deterministic.

**Recommendation**: Start with Option 2 for the first implementation, then migrate to Option 1 as tests mature.

## Core User Flows to Test

### Priority 1: Critical Paths (First Implementation)

These flows represent the most common user journeys and should be tested first.

#### 1. Homepage Navigation
- **Test**: Homepage loads with featured content
- **Actions**: Visit `/`, verify hero section, featured family card, recent items
- **Assertions**: Key elements visible, navigation links work

```typescript
test('homepage displays featured content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('homebrew');
  await expect(page.getByRole('link', { name: /browse monsters/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /browse items/i })).toBeVisible();
});
```

#### 2. Monster Browsing & Search
- **Test**: Browse and search for monsters
- **Actions**: Navigate to `/monsters`, use search, apply filters, paginate
- **Assertions**: Results update correctly, cards display

```typescript
test('can search for monsters by name', async ({ page }) => {
  await page.goto('/monsters');
  await page.getByPlaceholder(/search/i).fill('dragon');
  await page.waitForTimeout(300); // debounce
  const cards = page.locator('[data-testid="monster-card"]');
  await expect(cards.first()).toBeVisible();
});

test('can filter monsters by type', async ({ page }) => {
  await page.goto('/monsters');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /legendary/i }).click();
  // Verify URL updates
  await expect(page).toHaveURL(/type=legendary/);
});
```

#### 3. Monster Detail View
- **Test**: View a monster's detail page
- **Actions**: Click on a monster card, view full stat block
- **Assertions**: Monster name, stats, abilities displayed correctly

```typescript
test('can view monster detail page', async ({ page }) => {
  await page.goto('/monsters');
  const firstCard = page.locator('[data-testid="monster-card"]').first();
  const monsterName = await firstCard.locator('h3').textContent();
  await firstCard.click();
  await expect(page.getByRole('heading')).toContainText(monsterName!);
});
```

#### 4. Item Browsing & Search
- **Test**: Browse and search for items
- **Actions**: Navigate to `/items`, search, filter by rarity
- **Assertions**: Item cards display, filters work

```typescript
test('can filter items by rarity', async ({ page }) => {
  await page.goto('/items');
  await page.getByRole('combobox').filter({ hasText: /rarity/i }).click();
  await page.getByRole('option', { name: /legendary/i }).click();
  await expect(page).toHaveURL(/rarity=legendary/);
});
```

#### 5. Share Menu & Download
- **Test**: Download monster/item card image
- **Actions**: Open share menu, click download card image
- **Assertions**: Download initiates (check download event or mock)

```typescript
test('can initiate card image download', async ({ page }) => {
  await page.goto('/monsters');
  const shareButton = page.locator('[data-testid="share-menu"]').first();
  await shareButton.click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: /card image/i }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
```

### Priority 2: Secondary Flows (Future)

These should be added after Priority 1 is stable.

#### 6. Collection Browsing
- View public collections
- Navigate to collection detail
- See items in collection

#### 7. Family Browsing
- View monster families
- See related monsters in family

#### 8. Pagination
- Load more results on monster/item pages
- Verify cursor-based pagination works

#### 9. Sort Options
- Test different sort orders (name, level, date)
- Verify results reorder correctly

### Priority 3: Authenticated Flows (Future)

These require authentication mocking.

#### 10. Create Monster
- Fill out monster creation form
- Submit and verify redirect to detail page

#### 11. Add to Collection
- Add monster/item to collection
- Verify it appears in collection

#### 12. User Dashboard
- View `/my/monsters`
- See user's created content

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add Firefox/Safari later
  ],

  // Run dev server before tests (local only)
  webServer: process.env.CI ? undefined : {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

### package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## CI Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Build application
        run: pnpm run build
        env:
          # Required env vars for build
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          TURSO_DATABASE_URL: ${{ secrets.TEST_TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TEST_TURSO_AUTH_TOKEN }}

      - name: Start server and run E2E tests
        run: |
          pnpm run start &
          sleep 10
          pnpm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000
          # Add other required env vars

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Local Development

For local development, the dev server is assumed to be already running at `localhost:3000` per CLAUDE.md instructions. Tests can be run with:

```bash
# Run all E2E tests
pnpm run test:e2e

# Run with UI for debugging
pnpm run test:e2e:ui

# Run specific test file
pnpm run test:e2e monster-browse.spec.ts
```

## Test Data Requirements

For deterministic tests, we need guaranteed test data. Options:

### Option A: Test Environment Database (Recommended for CI)

Set up a separate test database (Turso) with seeded content:
- 10+ public monsters (mix of standard, legendary, minion)
- 5+ public items (various rarities)
- 2+ public collections
- 1+ monster families

### Option B: API Mocking

Use Playwright's route interception for API mocking:

```typescript
await page.route('/api/monsters*', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ data: mockMonsters }),
  });
});
```

**Recommendation**: Use Option A for realistic tests, with Option B as fallback for edge cases.

## Data Attributes for Testing

Add `data-testid` attributes to key elements:

| Element | Attribute |
|---------|-----------|
| Monster card | `data-testid="monster-card"` |
| Item card | `data-testid="item-card"` |
| Share menu trigger | `data-testid="share-menu"` |
| Search input | `data-testid="search-input"` |
| Load more button | `data-testid="load-more"` |
| Filter dropdowns | `data-testid="filter-{name}"` |

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. Create `playwright.config.ts`
2. Set up directory structure
3. Add npm scripts
4. Implement homepage test
5. Implement basic monster browse test

### Phase 2: Core Flows (Week 2)
1. Monster search and filter tests
2. Monster detail page test
3. Item browse and filter tests
4. Item detail page test

### Phase 3: Sharing & Downloads (Week 3)
1. Share menu tests
2. Download card image test
3. Copy link functionality test

### Phase 4: CI Integration (Week 3-4)
1. GitHub Actions workflow
2. Test database setup
3. Artifact upload for failures
4. PR status checks

### Phase 5: Expansion (Ongoing)
1. Add authenticated flow tests
2. Add collection tests
3. Add family tests
4. Expand browser coverage (Firefox, Safari)

## Success Metrics

- **Coverage**: All Priority 1 flows have passing tests
- **Reliability**: < 5% flaky test rate
- **Speed**: Full suite runs in < 5 minutes
- **CI Integration**: Tests block PR merge on failure

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Flaky tests due to async hydration | Use Playwright's auto-wait; add explicit waits for debounced inputs |
| Test data instability | Seed deterministic test data; use API mocking when needed |
| Slow CI runs | Run only Chromium initially; parallelize carefully |
| Auth complexity with Discord OAuth | Mock session cookie; don't test OAuth flow itself |
| Image download testing | Use Playwright's download event API |

## Appendix: Key Files Reference

| Purpose | File |
|---------|------|
| Monster browse page | `app/monsters/page.tsx` |
| Monster detail page | `app/monsters/[id]/page.tsx` |
| Monster grid component | `app/ui/monster/PaginatedMonsterGrid.tsx` |
| Filter bar | `app/ui/monster/MonsterFilterBar.tsx` |
| Share menu | `components/ShareMenu.tsx` |
| Item browse page | `app/items/page.tsx` |
| Item detail page | `app/items/[itemId]/page.tsx` |
| Home page | `app/page.tsx` |
| API routes | `app/api/monsters/`, `app/api/items/` |
