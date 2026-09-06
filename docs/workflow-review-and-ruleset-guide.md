# Next.js Project — Workflow, Config & Branch Protection Review

**Repo:** `gitlab-cicd` (hosted on GitHub)
**Stack:** Next.js 16 + React 19 + pnpm + Tailwind v4
**Reviewed files:** `eslint.config.mjs`, `postcss.config.mjs`, `commitlint.config.js`, `next.config.ts`, `package.json`, `bugfix.md` PR template, `.gitlab-ci.yml`

---

## 1. Executive Summary

| Area                       | Current State                                       | Industry Alignment                         | Score  |
| -------------------------- | --------------------------------------------------- | ------------------------------------------ | ------ |
| ESLint                     | Flat config, Next.js rules + custom hardening rules | Good baseline, missing a11y/import hygiene | 7/10   |
| Prettier                   | Referenced in scripts, config file not uploaded     | Cannot fully verify                        | 6/10   |
| Commitlint                 | Conventional commits + strict scope-enum            | Strong — above average                     | 8.5/10 |
| Husky + lint-staged        | Configured in `package.json`                        | Standard, correct                          | 8/10   |
| `next.config.ts`           | Default/empty                                       | Below standard for production              | 4/10   |
| `package.json`             | Clean, pinned package manager                       | Missing `engines`, `test` script           | 6.5/10 |
| PR Templates               | Bugfix template solid                               | Good structure, minor gaps                 | 7.5/10 |
| CI/CD (`.gitlab-ci.yml`)   | Multi-stage, gated deploys                          | Strong pipeline design                     | 8/10   |
| Branch Protection (GitHub) | Not yet configured (screenshots show defaults)      | Needs explicit hardening                   | —      |

**Overall: solid foundation, above-average commit hygiene and CI structure. Biggest gaps are in `next.config.ts` (security headers) and formalizing branch protection rules.**

---

## 2. Component Review

### 2.1 `eslint.config.mjs` — 7/10

**Good:**

- Uses ESLint **flat config** (`defineConfig`) — current standard as of ESLint 9, not the legacy `.eslintrc`.
- Extends `eslint-config-next` for both `core-web-vitals` and `typescript` — correct for Next.js 15/16 apps.
- Explicit hardening rules: `no-console`, `no-debugger`, `no-var`, `prefer-const`, `no-duplicate-imports`, `no-throw-literal`.
- Proper `globalIgnores` for build artifacts.

**Gaps vs. industry standard:**

- No **`eslint-config-prettier`** in the `extends` chain — without it, ESLint stylistic rules can conflict with Prettier formatting. You have `eslint-config-prettier` installed (per `package.json`) but it isn't wired into the config.
- No accessibility linting (`eslint-plugin-jsx-a11y`) — standard for any production React/Next.js app.
- No import ordering/hygiene (`eslint-plugin-import` or `simple-import-sort`) — common in mid-to-large codebases to prevent import chaos.
- `@typescript-eslint/no-explicit-any` set to `"warn"` — fine for now, but most teams tighten this to `"error"` before a 1.0 release.
- No `no-unused-vars` rule set (TypeScript's own unused-vars check via `tsconfig` `noUnusedLocals` is a common substitute — confirm this is enabled in `tsconfig.json`).

**Recommended addition:**

```js
import prettierConfig from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  jsxA11y.flatConfigs.recommended,
  prettierConfig, // must be last to override conflicting stylistic rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // ...existing rules
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts']),
])
```

---

### 2.2 `postcss.config.mjs` — 8/10

Minimal and correct for Tailwind v4 (`@tailwindcss/postcss`). No autoprefixer needed since Tailwind v4 bundles it. Nothing to flag — this is the current recommended setup.

---

### 2.3 `commitlint.config.js` — 8.5/10

**Good:**

- Extends `@commitlint/config-conventional` — industry standard (used by Angular, and most OSS/enterprise repos).
- `scope-enum` is unusually well-thought-out — mapping to your actual architecture (atoms/molecules/organisms = atomic design, plus `payload`, `security`, `api`). This is **above average**; most teams skip scope enforcement entirely.
- `subject-case: lower-case` and length limits enforce clean, scannable commit logs.

**Gaps:**

- No `header-max-length` rule (defaults from `config-conventional` cap at 100, which matches your `subject-max-length` — fine, just confirm no drift).
- No `footer-max-line-length` — inconsistent with your `body-max-line-length: 200`. Add for parity:

```js
'footer-max-line-length': [2, 'always', 200],
```

- Consider `type-enum` also allowing `hotfix` — you use `hotfix.md`/`hotfix/*` branches elsewhere but `hotfix` isn't a valid commit type here. Either enforce `fix` for hotfix branches (semantically correct — a hotfix _is_ a fix), or add `hotfix` to the enum for traceability. Most teams use `fix` and let the **branch name** carry the "hotfix" urgency signal, not the commit type — recommend keeping it as-is.

---

### 2.4 Husky + lint-staged (via `package.json`) — 8/10

- `"prepare": "husky"` is the correct Husky v9 convention (replaces the older `husky install`).
- `lint-staged` config covers JS/TS (eslint + prettier) and JSON/MD/CSS (prettier only) — standard split.
- **Missing:** no `pre-push` hook script visible, and no `commit-msg` hook file in the repo tree you've shared (only implied from earlier conversation). Confirm `.husky/pre-commit`, `.husky/commit-msg`, and `.husky/pre-push` actually exist on disk — a `lint-staged` config in `package.json` does nothing without the corresponding Husky hook file calling it.

---

### 2.5 `next.config.ts` — 4/10 (biggest gap)

Currently empty (`/* config options here */`). For a production-grade repo with CI/CD and multiple environments, this is under-configured. Industry-standard additions:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't leak "X-Powered-By: Next.js"
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

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

This directly supports the **security scanning stage** already in your `.gitlab-ci.yml` (SAST/secret detection) — headers are a common audit finding otherwise.

---

### 2.6 `package.json` — 6.5/10

**Good:**

- `packageManager: "pnpm@10.34.2"` pinned via Corepack — correct, ensures CI and local dev use identical pnpm versions.
- Clean separation of `dependencies` vs `devDependencies`.
- Script names (`lint`, `type-check`, `format`, `format:check`) match exactly what your CI pipeline calls — good consistency, no drift.

**Gaps:**

- No `engines` field. Add:

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=10.0.0"
}
```

This prevents contributors on old Node versions from silently producing different lockfile/build output.

- No `test` script or test framework (Vitest/Jest/Playwright) present anywhere in the stack. Your CI has no test stage either — this is the single largest gap versus a typical "industry-standard" pipeline, which usually gates merges on unit + at least smoke/e2e tests, not just lint/build/type-check.
- No `postinstall` / Husky safety guard for CI (you already handle this correctly via `HUSKY=0` in the CI YAML — good).

---

### 2.7 PR Template (`bugfix.md`) — 7.5/10

Solid structure: root cause, solution, testing checklist, linked issues. Matches common OSS/enterprise bug-report templates.

**Minor gaps:**

- No **severity/priority** field (P0–P3) — useful for triage at a glance.
- No **rollback plan** field — you have this on `hotfix.md` presumably, but it's arguably just as relevant for bugfixes touching production paths.
- "Security implications considered" and "Performance impact assessed" are good checklist items — keep these, they're often skipped in smaller teams' templates.

---

### 2.8 CI/CD (`.gitlab-ci.yml`, from earlier) — 8/10

Already reviewed in depth. Strong points: staged quality gates, `guard-target-branch` job (prevents non-maintainers from targeting `main`/`stage` in MRs), manual+environment-gated deploys. Gap: **no test stage**, tied to the missing test framework above.

---

## 3. Priority Improvement Roadmap

| Priority  | Item                                                     | Effort | Impact |
| --------- | -------------------------------------------------------- | ------ | ------ |
| 🔴 High   | Add security headers to `next.config.ts`                 | Low    | High   |
| 🔴 High   | Wire `eslint-config-prettier` into ESLint extends        | Low    | Medium |
| 🔴 High   | Add a test framework (Vitest/Playwright) + CI test stage | Medium | High   |
| 🟠 Medium | Add `engines` field to `package.json`                    | Low    | Low    |
| 🟠 Medium | Add `jsx-a11y` ESLint plugin                             | Low    | Medium |
| 🟠 Medium | Add `footer-max-line-length` to commitlint               | Low    | Low    |
| 🟡 Low    | Add severity field to PR templates                       | Low    | Low    |
| 🟡 Low    | Consider `no-unused-vars`/import-sort plugin             | Low    | Medium |

---

## 4. GitHub Ruleset Configuration Guide

Based on the ruleset screens you're on (**Settings → Rules → Rulesets**, `Protect main` and `Protect stage`). GitHub's new **Rulesets** are the recommended replacement for classic branch protection — you're already in the right place.

### 4.1 Recommended settings — `Protect main`

| Rule                                      | Setting                                                                                                                   | Reasoning                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Restrict creations                        | Not applicable (branch already exists)                                                                                    | —                                                                                   |
| **Restrict updates**                      | ✅ On, bypass: **Admin/Maintainer role only**                                                                             | Blocks direct pushes for everyone else, even with write access                      |
| **Restrict deletions**                    | ✅ On                                                                                                                     | Prevents accidental branch deletion                                                 |
| **Require linear history**                | ✅ On                                                                                                                     | Forces squash/rebase merges → clean, bisectable history                             |
| Require deployments to succeed            | ✅ On → require `staging` environment success                                                                             | Ensures nothing reaches `main` without a verified stage deploy                      |
| Require signed commits                    | 🟡 Optional (On if team uses GPG/SSH signing)                                                                             | Good practice, not mandatory to start                                               |
| **Require a pull request before merging** | ✅ On — require **2 approvals**, dismiss stale approvals on new commits, require Code Owner review if `CODEOWNERS` exists | `main` = production, highest scrutiny                                               |
| **Require status checks to pass**         | ✅ On — select: `quality-checks`, `verify:types`, `verify:build`, `sast`, `secret_detection`                              | Mirrors your CI pipeline exactly                                                    |
| **Block force pushes**                    | ✅ On                                                                                                                     | Non-negotiable for `main`                                                           |
| Require code scanning results             | ✅ On (map to SAST job)                                                                                                   | You already run GitLab SAST/secret detection — mirror on GitHub if using CodeQL too |
| Require code quality results              | 🟡 Optional                                                                                                               | Enable if you adopt a code-quality gate (e.g., SonarCloud)                          |
| Restrict code coverage                    | 🟡 Optional                                                                                                               | Enable once a test suite + coverage reporting exists (see roadmap item)             |
| Auto-request Copilot review               | 🟡 Optional                                                                                                               | Nice-to-have, not a gate                                                            |

**Bypass list:** Add only your **Admin** team/role — for genuine emergency hotfixes. Keep it as small as possible; an empty bypass list is the strictest and often preferred for `main`.

### 4.2 Recommended settings — `Protect stage`

Same as `main`, with these relaxations:

| Rule                                                                            | Difference from `main`                                                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Require a pull request before merging                                           | ✅ On, but **1 approval** is acceptable (faster iteration before prod)                                                         |
| Require deployments to succeed                                                  | ✅ On → require `testing` environment success (mirrors `test → stage` flow)                                                    |
| Require linear history                                                          | 🟡 Optional — some teams allow merge commits into `stage` for easier bisecting of what "test → stage" batches went in together |
| Require signed commits                                                          | Optional, same as `main`                                                                                                       |
| Everything else (status checks, block force pushes, restrict deletions/updates) | **Keep identical to `main`**                                                                                                   |

### 4.3 `test` branch

Leave this branch **unprotected or lightly protected** (require status checks only, no PR/approval requirement) so contributors can merge feature/bugfix/hotfix branches quickly. This matches the `test → stage → main` promotion flow already encoded in your `.gitlab-ci.yml`'s `guard-target-branch` job.

### 4.4 Net result

```
feature/* , bugfix/* , hotfix/*
        │  (freely mergeable)
        ▼
      test  ───────────────► CI: lint, types, build, quality
        │  (PR + 1 approval + CI green + test-env deploy success)
        ▼
      stage ───────────────► CI: full pipeline + staging deploy
        │  (PR + 2 approvals + CI green + staging deploy success, admin bypass only)
        ▼
      main  ───────────────► CI: full pipeline + production deploy + health check
```

This gives you: fast iteration on `test`, a real QA gate on `stage`, and a fully locked-down `main` that only admins can force through in an emergency — matching what you asked for ("only admin can push to stage and main").
