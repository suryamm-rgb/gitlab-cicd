# Next.js Project Setup — End-to-End Engineering Standard

**Scope:** Zero → production-grade repository setup: Git, branching strategy, TypeScript, ESLint, Prettier, Commitlint, Husky, testing, CI/CD, branch protection, and PR governance.

**Audience:** Any engineer setting up a new Next.js project who wants it to meet the bar a senior/staff engineer would expect in review — nothing here is exotic; it's the common baseline used across most well-run frontend orgs.

**Stack:** Next.js (App Router) · React · TypeScript · pnpm · Tailwind (optional) · Vitest · GitHub Actions

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Prerequisites](#2-prerequisites)
3. [Project Initialization](#3-project-initialization)
4. [Git & Remote Setup](#4-git--remote-setup)
5. [Branching Strategy](#5-branching-strategy)
6. [TypeScript Configuration](#6-typescript-configuration)
7. [ESLint](#7-eslint)
8. [Prettier](#8-prettier)
9. [Commitlint (Conventional Commits)](#9-commitlint-conventional-commits)
10. [Husky Git Hooks + lint-staged](#10-husky-git-hooks--lint-staged)
11. [Testing (Vitest + Testing Library)](#11-testing-vitest--testing-library)
12. [Security Headers (next.config.ts)](#12-security-headers-nextconfigts)
13. [Environment Variables](#13-environment-variables)
14. [CODEOWNERS](#14-codeowners)
15. [Pull Request Templates](#15-pull-request-templates)
16. [CI Pipeline (GitHub Actions)](#16-ci-pipeline-github-actions)
17. [Branch Protection (GitHub Rulesets)](#17-branch-protection-github-rulesets)
18. [README](#18-readme)
19. [Final Verification Checklist](#19-final-verification-checklist)
20. [Directory Tree Reference](#20-directory-tree-reference)
21. [What a Senior Engineer Would Add Next](#21-what-a-senior-engineer-would-add-next)

---

## 1. Philosophy

Every piece of tooling below exists to answer one of three questions **before a human reviewer has to**:

| Question                                                      | Tool that answers it              |
| ------------------------------------------------------------- | --------------------------------- |
| Is the code syntactically/stylistically consistent?           | ESLint + Prettier                 |
| Does the commit history tell a clean, machine-readable story? | Commitlint + Conventional Commits |
| Did the author actually run the checks locally?               | Husky hooks                       |
| Does the code still work after this change?                   | Vitest + CI                       |
| Can this reach production without a second pair of eyes?      | Branch protection / Rulesets      |

The goal is **cheap, fast, local feedback first** (hooks), **authoritative, unskippable feedback second** (CI + branch protection). Never rely on hooks alone — they can be bypassed with `--no-verify`. CI and branch protection are the real gate.

---

## 2. Prerequisites

```bash
node -v      # v20+ recommended
corepack -v  # ships with Node 16.9+, used to pin pnpm
```

Enable pnpm via Corepack (don't `npm install -g pnpm` — Corepack keeps the version pinned per-project):

```bash
corepack enable
corepack prepare pnpm@10.34.2 --activate
```

---

## 3. Project Initialization

```bash
pnpm dlx create-next-app@latest my-app
cd my-app
```

Recommended prompts: **TypeScript: Yes**, **ESLint: Yes**, **Tailwind: Yes/No per project**, **App Router: Yes**, **`src/` directory: Yes** (keeps root clean, separates config from app code).

---

## 4. Git & Remote Setup

```bash
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/<org>/<repo>.git
git push -u origin main
```

---

## 5. Branching Strategy

This setup uses a **three-tier promotion model** — simpler than full Git Flow, stricter than pure trunk-based development. It fits small-to-mid teams that deploy to distinct test/staging/production environments.

```
feature/*, bugfix/*, hotfix/*
        │   short-lived, freely mergeable
        ▼
      test     — integration branch, default branch for day-to-day work
        │   PR + 1 approval + CI green
        ▼
      stage    — pre-production, mirrors prod config
        │   PR + 2 approvals + CI green + staging deploy verified, admin-only merge
        ▼
      main     — production, tagged releases deploy from here
```

**Why not Git Flow?** Git Flow's `develop`/`release`/`hotfix` branches add ceremony most teams under ~30 engineers don't need. **Why not pure trunk-based?** Trunk-based (everyone merges straight to `main` behind feature flags) is excellent but requires feature-flag infrastructure and very mature CI — most teams aren't there yet. This three-tier model is the pragmatic middle ground and maps directly onto three real deployment environments.

```bash
git checkout -b stage && git push -u origin stage
git checkout -b test && git push -u origin test
```

Set **`test`** as the repository's default branch (Settings → General → Default branch) — that's where PRs land by default.

Branch naming convention:

```
feature/<ticket-id>-short-description   e.g. feature/PROJ-142-add-signup-form
bugfix/<ticket-id>-short-description
hotfix/<ticket-id>-short-description
```

---

## 6. TypeScript Configuration

Strict mode is non-negotiable for any codebase expected to last beyond a prototype.

```bash
touch tsconfig.json
```

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`noUncheckedIndexedAccess` and `noUnusedLocals` are the two most commonly skipped flags that catch real bugs — array/object access returning `undefined` and dead code, respectively.

---

## 7. ESLint

```bash
pnpm add -D eslint eslint-config-next eslint-config-prettier eslint-plugin-jsx-a11y
```

`eslint.config.mjs` (flat config — the current standard for ESLint 9+):

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  jsxA11y.flatConfigs.recommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
    },
  },

  // Must stay LAST — disables stylistic rules that would fight Prettier.
  prettierConfig,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts']),
])
```

**Why `eslint-config-prettier` must be last:** ESLint and Prettier both have opinions about formatting (quotes, spacing). Without this, you get contradictory autofix behavior — ESLint fixes one way, Prettier reformats the other way, infinite churn on save. Loading it last strips out ESLint's conflicting stylistic rules and lets Prettier own formatting exclusively.

---

## 8. Prettier

```bash
pnpm add -D prettier
```

`.prettierrc.json` — **keep exactly one Prettier config file in the repo.** Multiple config files (`.prettierrc`, `.prettierrc.json`, a `"prettier"` key in `package.json`) is a common real-world bug: Prettier silently picks whichever it finds first per its [resolution order](https://prettier.io/docs/configuration-file), and the rest are dead weight nobody notices until formatting looks "wrong" on someone's machine.

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "quoteProps": "as-needed"
}
```

`.prettierignore`:

```
node_modules
.next
build
pnpm-lock.yaml
```

---

## 9. Commitlint (Conventional Commits)

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

`commitlint.config.js`:

```js
const commitlintConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      // Tailor this list to your actual architecture — don't leave it generic.
      ['api', 'ui', 'auth', 'config', 'ci', 'deps', 'docs', 'tests', 'security'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
    'footer-max-line-length': [2, 'always', 200],
  },
}
export default commitlintConfig
```

Commit format:

```
<type>(<scope>): <subject>

feat(auth): add refresh-token rotation
fix(api): handle null response from payment provider
```

**Why enforce this at all?** Conventional Commits make `CHANGELOG` generation and semantic versioning fully automatable later (via `semantic-release` or `changesets`) with zero manual bookkeeping — the payoff compounds as the repo ages.

---

## 10. Husky Git Hooks + lint-staged

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

**`.husky/pre-commit`**

```bash
#!/bin/sh
pnpm exec lint-staged
```

**`.husky/commit-msg`**

```bash
#!/bin/sh
pnpm exec commitlint --edit "$1"
```

**`.husky/pre-push`** — this should mirror your CI's cheapest-to-most-expensive checks, so failures surface locally before a push, not five minutes later in CI:

```bash
#!/bin/sh
pnpm run type-check
pnpm run lint
pnpm run format:check
pnpm run build

echo "✅ All pre-push checks passed!"
```

```bash
chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push
```

**Important:** hooks are a _local_ convenience, not a security boundary — `git commit --no-verify` bypasses all of them. CI and branch protection (Sections 16–17) are what actually enforce these rules; treat hooks purely as fast local feedback.

---

## 11. Testing (Vitest + Testing Library)

```bash
pnpm add -D vitest jsdom @vitejs/plugin-react @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', '.next/', '**/*.config.*', '**/*.d.ts'],
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Example test (place near the component it covers, or under `src/__tests__/`):

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>
}

describe('Hello component', () => {
  it('renders the given name', () => {
    render(<Hello name="World" />)
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })
})
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

For end-to-end coverage on top of unit tests, add **Playwright** once you have real user flows worth protecting (checkout, auth, onboarding) — not required on day one.

---

## 12. Security Headers (next.config.ts)

An empty `next.config.ts` is one of the most common findings in a first-pass security review. Set a baseline:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { formats: ['image/avif', 'image/webp'] },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
```

Add a `Content-Security-Policy` once you know your full set of third-party script/asset origins — a CSP added too early with a wildcard defeats its own purpose.

---

## 13. Environment Variables

`.env.example` — committed to the repo, contains **no real secrets**, exists purely so a new contributor knows what to set:

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# CI/deploy only — not needed for local dev
# VERCEL_TOKEN=
# VERCEL_ORG_ID=
# VERCEL_PROJECT_ID=
```

Confirm `.gitignore` excludes `.env`, `.env.local`, `.env.*.local` — `create-next-app` does this by default, but verify it wasn't accidentally removed.

---

## 14. CODEOWNERS

Required if you plan to enable "Require review from Code Owners" in branch protection (Section 17).

```
# .github/CODEOWNERS
*                       @your-org/maintainers
/.github/               @your-org/maintainers
/next.config.ts         @your-org/maintainers
/commitlint.config.js   @your-org/maintainers
```

Use a **team handle** (`@org/team`), not individual usernames, so this doesn't rot when people change roles.

---

## 15. Pull Request Templates

GitHub supports multiple templates via `.github/PULL_REQUEST_TEMPLATE/*.md`; the author picks one from a dropdown when opening a PR (or via `?template=` in the URL).

`.github/PULL_REQUEST_TEMPLATE/feature.md`:

```markdown
## 📝 Description

Brief description of the feature.

## 🎯 Type of Change

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📚 Documentation

## 🧪 Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Preview deployment tested

## 🔗 Related Issues

Closes #

## ✅ Checklist

- [ ] Self-review completed
- [ ] No console.log left in
- [ ] Security implications considered
- [ ] Accessibility checked
```

`.github/PULL_REQUEST_TEMPLATE/bugfix.md` and `.github/PULL_REQUEST_TEMPLATE/hotfix.md` follow the same shape, adjusted for root-cause analysis and rollback urgency respectively (hotfix should include a **deployment urgency** and **post-deployment monitoring** section — see the hotfix template pattern from Section 21 for reference if you don't already have one).

---

## 16. CI Pipeline (GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [test, stage, main]
  push:
    branches: [test, stage, main]

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.34.2

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=critical
      - run: pnpm run type-check
      - run: pnpm run lint
      - run: pnpm run format:check
      - run: pnpm run test
      - run: pnpm run build
```

Order matters: cheapest/fastest checks first (audit, type-check) so a broken PR fails in seconds, not after a multi-minute build.

---

## 17. Branch Protection (GitHub Rulesets)

Go to **Settings → Rules → Rulesets → New branch ruleset**. Configure two rulesets:

### `main` (production — strictest)

| Rule                                  | Setting                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Restrict updates                      | ✅ On — bypass: Admin role only                                         |
| Restrict deletions                    | ✅ On                                                                   |
| Require linear history                | ✅ On                                                                   |
| Require a pull request before merging | ✅ On — 2 approvals, dismiss stale approvals, require Code Owner review |
| Require status checks to pass         | ✅ On — select the `quality` job from CI                                |
| Block force pushes                    | ✅ On                                                                   |
| Require signed commits                | 🟡 Optional, recommended once team adopts GPG/SSH signing               |
| Bypass list                           | Admin team only, or empty for maximum strictness                        |

### `stage` (pre-production — same rigor, faster iteration)

Identical to `main` except: **1 approval** instead of 2, linear history optional. Everything else (status checks, block force pushes, restrict deletions/updates) stays the same.

### `test` (integration — lightweight)

No approval requirement; require status checks to pass only. This is where day-to-day feature/bugfix branches land quickly.

```
Result:
feature/* → PR → test   (1 CI pass, no approval)
test      → PR → stage  (1 approval, CI pass, admin-gated merge)
stage     → PR → main   (2 approvals, CI pass, admin-gated merge)
```

---

## 18. README

Every repo needs at minimum: setup instructions, script reference, commit convention, branch strategy, and PR template pointers. See Section 21 for what to add as the project matures (architecture docs, ADRs, contribution guide).

---

## 19. Final Verification Checklist

Run through this on a clean clone before calling the setup "done":

- [ ] `pnpm install` completes with no errors
- [ ] `pnpm dev` starts the app
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test` passes (and the example test is real, not a placeholder left in permanently)
- [ ] `pnpm build` succeeds
- [ ] Committing with a bad message (e.g. `git commit -m "asdf"`) is **rejected** by commit-msg hook
- [ ] Staging a badly-formatted file and committing triggers auto-fix via pre-commit
- [ ] Pushing directly to `main` from local is **rejected** by GitHub (branch protection working)
- [ ] Opening a PR shows the template picker with all three templates
- [ ] CI runs and reports status checks on the PR
- [ ] `.env.local` is `.gitignore`d and never appears in `git status`

---

## 20. Directory Tree Reference

```
my-app/
├── .github/
│   ├── workflows/ci.yml
│   ├── PULL_REQUEST_TEMPLATE/
│   │   ├── feature.md
│   │   ├── bugfix.md
│   │   └── hotfix.md
│   └── CODEOWNERS
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── src/
│   └── ...app code...
├── .env.example
├── .gitignore
├── .prettierrc.json
├── .prettierignore
├── commitlint.config.js
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── README.md
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

---

## 21. What a Senior Engineer Would Add Next

This baseline is solid for a new project. As it matures, expect (and plan for) these additions:

| Addition                                         | When to add it                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Dependabot / Renovate**                        | Immediately — automated dependency PRs cost nothing to set up and prevent silent staleness |
| **CodeQL / SAST scanning**                       | Before handling any real user data                                                         |
| **`SECURITY.md`**                                | Before any external contributors or public repo status                                     |
| **Playwright E2E tests**                         | Once there are real critical user flows (auth, checkout, onboarding)                       |
| **`semantic-release` or `changesets`**           | Once you're versioning a library/package, not just an app                                  |
| **Architecture Decision Records (`/docs/adr/`)** | Once the team is >3 engineers and decisions need a paper trail                             |
| **Storybook**                                    | Once the component library grows past ~15-20 shared components                             |
| **Observability (Sentry, OpenTelemetry)**        | Before first production deploy, not after the first incident                               |
| **Docker / devcontainer**                        | Once onboarding a new engineer takes more than "clone + `pnpm install`"                    |
| **Load/perf budgets in CI (Lighthouse CI)**      | Once the app has real traffic and page-weight regressions matter                           |

None of these are wrong to skip on day one — they're wrong to _never revisit_. This document describes the floor, not the ceiling.
