# my-app

Next.js application with an enforced quality pipeline (ESLint, Prettier, Commitlint, Husky, Vitest, GitHub Actions).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in real values
pnpm dev
```

## Scripts

| Command              | Purpose                          |
| -------------------- | -------------------------------- |
| `pnpm dev`           | Start the dev server             |
| `pnpm build`         | Production build                 |
| `pnpm lint`          | Run ESLint                       |
| `pnpm type-check`    | Run TypeScript in no-emit mode   |
| `pnpm format`        | Format all files with Prettier   |
| `pnpm format:check`  | Check formatting without writing |
| `pnpm test`          | Run the Vitest unit test suite   |
| `pnpm test:coverage` | Run tests with coverage report   |

## Git hooks (Husky)

- **pre-commit** — runs `lint-staged` (ESLint + Prettier on staged files)
- **commit-msg** — validates the commit message against `commitlint.config.js`
- **pre-push** — runs type-check, lint, format:check, and build before allowing a push

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint:

```
<type>(<scope>): <subject>

feat(forms): add client-side validation to signup form
fix(api): handle null response from payment provider
chore(config): bump eslint to v9
```

Allowed types and scopes are defined in `commitlint.config.js`.

## Branch strategy

```
feature/*, bugfix/*, hotfix/*
        │  (freely mergeable, PR required)
        ▼
      test    — CI: lint, types, build, tests
        │  (PR + 1 approval + CI green)
        ▼
      stage   — CI: full pipeline + staging deploy
        │  (PR + 2 approvals + CI green, admin bypass only)
        ▼
      main    — CI: full pipeline + production deploy + health check
```

`main` and `stage` are protected via GitHub Rulesets — only admins can push directly; everyone else must go through a pull request with passing status checks.

## Pull requests

Use the appropriate template when opening a PR:

- `.github/PULL_REQUEST_TEMPLATE/feature.md`
- `.github/PULL_REQUEST_TEMPLATE/bugfix.md`
- `.github/PULL_REQUEST_TEMPLATE/hotfix.md`
