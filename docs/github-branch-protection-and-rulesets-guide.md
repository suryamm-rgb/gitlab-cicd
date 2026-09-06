# GitHub Branch Protection: Rulesets & Branch Protection Rules

### End-to-End Setup Guide for a `feature → test → stage → main` Workflow

---

## 1. Overview

GitHub gives you **two separate systems** to protect important branches like `main` and `stage`. Both can coexist, and in this guide we configure both so the repository is fully protected and shows the "Protected" badge in the UI.

| System                      | Location                    | Introduced         | UI Badge?               |
| --------------------------- | --------------------------- | ------------------ | ----------------------- |
| **Rulesets**                | Settings → Rules → Rulesets | Newer (2023+)      | No visible badge        |
| **Branch Protection Rules** | Settings → Branches         | Classic / Original | Yes — shows "Protected" |

Both can enforce the same core protections (require PR, require approvals, block force pushes, block deletions). Rulesets are more flexible (bypass lists, multiple branch targets, layering), while Branch Protection Rules are simpler and show the classic badge.

**Target workflow this guide protects:**

```
feature/*  →  test  →  stage 🔒  →  main 🔒
```

`stage` and `main` are protected. `feature/*` and `test` remain open for free pushing/collaboration.

---

## 2. Prerequisites

- Repository must be **public** if you're on GitHub Free (branch protection/rulesets on private repos requires GitHub Team/Enterprise).
- You must be the **repository owner** or have **admin** access.
- Collaborators should already be invited (Settings → Collaborators and teams → Add people).

---

## 3. Part A — Setting Up Rulesets

### 3.1 What is a Ruleset?

A Ruleset is a named collection of rules applied to one or more target branches. You can create multiple rulesets (e.g., one per branch) or one ruleset targeting several branches at once.

### 3.2 Step-by-Step: Create a Ruleset

| Step | Action                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------- |
| 1    | Go to **Settings → Rules → Rulesets**                                                           |
| 2    | Click **New ruleset → New branch ruleset**                                                      |
| 3    | Enter a **Ruleset Name** (e.g., `Protect main`)                                                 |
| 4    | Set **Enforcement status** to `Active` (or `Evaluate` to test without enforcing)                |
| 5    | Under **Bypass list**, leave empty if you want the rule to apply to _everyone including admins_ |
| 6    | Under **Target branches → Add target**, select the branch (e.g., `main`)                        |
| 7    | Under **Branch rules**, check the protections you want (see table below)                        |
| 8    | Click **Save changes**                                                                          |
| 9    | Repeat the whole process for `stage`                                                            |

### 3.3 What Each Rule Does

| Rule                                                      | What happens if you check it                                                                                                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Restrict creations**                                    | Only bypass-listed users can create a new branch matching this pattern.                                                                                                          |
| **Restrict updates**                                      | Only bypass-listed users can push commits directly to this branch.                                                                                                               |
| **Restrict deletions**                                    | Nobody (without bypass) can delete this branch.                                                                                                                                  |
| **Require linear history**                                | Blocks merge commits — forces squash or rebase merges only.                                                                                                                      |
| **Require deployments to succeed**                        | A specified environment must deploy successfully before this ref can be updated.                                                                                                 |
| **Require signed commits**                                | All commits must have a verified GPG/SSH signature.                                                                                                                              |
| **Require a pull request before merging**                 | All changes must go through a PR — no direct pushes allowed, even for admins (if bypass list is empty). This is the **core rule** that enforces your `test → stage → main` flow. |
| ⤷ **Required approvals** (sub-setting)                    | Sets minimum number of approving reviews needed before the Merge button unlocks. Setting this to `1` prevents someone from merging their own PR without review.                  |
| ⤷ **Dismiss stale approvals**                             | If new commits are pushed after approval, the approval is invalidated.                                                                                                           |
| ⤷ **Require review from Code Owners**                     | Requires approval specifically from users listed in a `CODEOWNERS` file for the changed files.                                                                                   |
| ⤷ **Require approval of the most recent reviewable push** | Closes a loophole where someone gets approved, then sneaks in one more unreviewed commit before merging.                                                                         |
| **Require status checks to pass**                         | CI checks (tests, lint, build) must pass before merge is allowed.                                                                                                                |
| **Block force pushes**                                    | Prevents `git push --force` on this branch — protects history from being rewritten.                                                                                              |
| **Require code scanning results**                         | Requires a configured code-scanning tool (e.g., CodeQL) to report no blocking issues.                                                                                            |
| **Require code quality results**                          | Requires a code-quality tool to pass configured severity thresholds.                                                                                                             |
| **Restrict code coverage**                                | Enforces a minimum test coverage percentage on the PR.                                                                                                                           |
| **Automatically request Copilot code review**             | Auto-requests a Copilot review bot on every new PR (if the author has access to Copilot review).                                                                                 |

### 3.4 Recommended Minimum Configuration (`main` and `stage`)

```
☑ Restrict deletions
☑ Require a pull request before merging
    Required approvals: 1
    ☑ Dismiss stale pull request approvals
    ☑ Require approval of the most recent reviewable push
☑ Block force pushes
Bypass list: EMPTY (applies to everyone, including owner)
```

---

## 4. Part B — Setting Up Classic Branch Protection Rules

### 4.1 What is a Branch Protection Rule?

An older, simpler system that protects branches matching a name pattern. Functionally overlaps with Rulesets but shows the visible **"Protected"** badge in the GitHub UI (e.g., on the branch dropdown in the Code tab).

> ⚠️ **Note:** Running both systems on the same branch is not harmful, but it is redundant. Whichever is stricter wins. Many teams pick **one** system to avoid maintaining duplicate settings. This guide sets up both because the "Protected" badge is a visible, useful signal for collaborators.

### 4.2 Step-by-Step: Create a Branch Protection Rule

| Step | Action                                                                |
| ---- | --------------------------------------------------------------------- |
| 1    | Go to **Settings → Branches**                                         |
| 2    | Click **Add branch protection rule** (or **Add rule**)                |
| 3    | In **Branch name pattern**, type the exact branch name (e.g., `main`) |
| 4    | Check the protections you want (see table below)                      |
| 5    | Click **Create**                                                      |
| 6    | Repeat for `stage`                                                    |

### 4.3 What Each Option Does

| Option                                                                 | What happens if you check it                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Require a pull request before merging**                              | Blocks direct pushes; all changes must come via PR.                                                    |
| ⤷ **Require approvals**                                                | Sets the minimum number of approving reviews (recommended: `1`).                                       |
| ⤷ **Dismiss stale pull request approvals when new commits are pushed** | Voids approval if new commits land after review.                                                       |
| ⤷ **Require review from Code Owners**                                  | Requires sign-off from users in `CODEOWNERS` for touched files.                                        |
| ⤷ **Require approval of the most recent reviewable push**              | The very last commit must specifically be approved by someone other than its author.                   |
| **Require status checks to pass before merging**                       | CI must pass before merge is allowed.                                                                  |
| **Require conversation resolution before merging**                     | All PR review comments/threads must be marked resolved before merging.                                 |
| **Require signed commits**                                             | Commits must be cryptographically signed.                                                              |
| **Require linear history**                                             | Forces squash/rebase merges; blocks merge commits.                                                     |
| **Require deployments to succeed before merging**                      | A chosen environment must successfully deploy first.                                                   |
| **Lock branch**                                                        | Makes the branch fully read-only — nobody can push, not even via PR. Rarely used except for archiving. |
| **Do not allow bypassing the above settings**                          | Ensures even repo admins/owners must follow these rules — no exceptions.                               |
| **Allow force pushes**                                                 | If checked, permits `git push --force` — leave **unchecked** for protected branches.                   |
| **Allow deletions**                                                    | If checked, permits deleting the branch — leave **unchecked** for protected branches.                  |

### 4.4 Recommended Minimum Configuration (`main` and `stage`)

```
Branch name pattern: main   (repeat with: stage)

☑ Require a pull request before merging
    Required approvals: 1
    ☑ Dismiss stale pull request approvals when new commits are pushed
    ☑ Require approval of the most recent reviewable push
☑ Require conversation resolution before merging
☑ Do not allow bypassing the above settings

Allow force pushes  → unchecked
Allow deletions     → unchecked
```

---

## 5. End-to-End Verification Checklist

| #   | Test                                                                    | Expected Result                                             |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `git push origin main` directly (no PR)                                 | ❌ Rejected — "changes must be made through a pull request" |
| 2   | `git push --force origin main`                                          | ❌ Rejected — force push blocked                            |
| 3   | `git branch -d` / delete `main` via UI                                  | ❌ Blocked — deletions restricted                           |
| 4   | Open a PR into `stage`, try to merge it yourself (as the only reviewer) | ❌ Blocked until 1 approval from someone else is given      |
| 5   | Push a new commit after approval is given                               | ⚠️ Approval dismissed — needs re-review                     |
| 6   | Open a PR from `test` → `stage`, get it approved, then merge            | ✅ Success                                                  |
| 7   | Open a PR from `stage` → `main`, get it approved, then merge            | ✅ Success                                                  |
| 8   | Check Code tab → branch dropdown                                        | ✅ `main` and `stage` show "Protected" badge                |

---

## 6. Practice Exercises

Use these to test your understanding and validate your own repository setup.

### Exercise 1 — Ruleset Design

You have a repo with branches `dev`, `test`, `stage`, and `main`. Only `stage` and `main` need protection. `dev` and `test` should remain fully open for any collaborator to push directly.

**Task:** Design the Ruleset(s) needed. Should you use **one ruleset targeting both branches**, or **two separate rulesets**? Justify your answer, and list the exact Branch rules you would check for each protected branch.

<details>
<summary>Sample Answer</summary>

Either approach works, but **two separate rulesets** (`Protect stage`, `Protect main`) is usually clearer, because:

- You can enable/disable protection per-branch independently (e.g., temporarily disable `stage` protection during a hotfix without touching `main`).
- Ruleset names stay self-documenting.

A single ruleset targeting both `stage` and `main` is valid too, and reduces duplication if the rules are identical — trade-off is less granular control.

Rules to check for both: `Restrict deletions`, `Require a pull request before merging` (Required approvals = 1), `Block force pushes`. Bypass list left empty.
</details>

---

### Exercise 2 — Self-Merge Loophole

A team sets up a Ruleset on `main` with only **"Require a pull request before merging"** checked (no other sub-settings). A solo collaborator opens a PR from `test` into `main` and successfully merges it without anyone else reviewing it.

**Task:** Explain why this was possible, and list the exact setting(s) needed to prevent it going forward.

<details>
<summary>Sample Answer</summary>

"Require a pull request before merging" only enforces that a PR must **exist** — it does not require any **approval**. Since no "Required approvals" number was set (default 0), the author could merge their own PR immediately.

Fix: Under that same rule, expand **"Show additional settings"** and set **Required approvals** to `1` or higher. This forces at least one other collaborator to approve before the Merge button is enabled.
</details>

---

### Exercise 3 — Build It Yourself

Starting from a fresh public repository with branches `feature/login`, `test`, `stage`, and `main`:

**Task:**

1. Create a Ruleset named `Protect stage` targeting `stage`.
2. Create a Ruleset named `Protect main` targeting `main`.
3. Both should require a PR, require 1 approval, dismiss stale approvals, and block force pushes and deletions.
4. Additionally create classic Branch Protection Rules for both branches with the same settings, so they show the "Protected" badge.
5. Verify: attempt a direct push to `main` from your terminal and confirm it is rejected.

<details>
<summary>Sample Answer / Steps</summary>

1. Settings → Rules → Rulesets → New ruleset → New branch ruleset → Name: `Protect stage` → Target: `stage` → check Restrict deletions, Require a pull request before merging (Required approvals: 1, Dismiss stale approvals), Block force pushes → Save.
2. Repeat with Name: `Protect main`, Target: `main`.
3. Settings → Branches → Add rule → Pattern: `stage` → check Require a pull request before merging (Required approvals: 1, Dismiss stale approvals, Require approval of most recent reviewable push), Do not allow bypassing → Create.
4. Repeat with Pattern: `main`.
5. Run:
   ```bash
   git checkout main
   echo "test" >> README.md
   git commit -am "test direct push"
   git push origin main
   ```
   Expected output: an error stating changes must be made through a pull request. This confirms protection is active.

</details>

---

## 7. Quick Reference Summary

```
Repository Owner (you)
        │
        ▼
   Collaborator added (Write-equivalent access on personal repo)
        │
        ▼
 ┌─────────────────────────────┐
 │  feature/*  →  test          │  ← open, direct push allowed
 └─────────────────────────────┘
        │  PR required
        ▼
 ┌─────────────────────────────┐
 │  stage 🔒                    │  ← PR + 1 approval required
 └─────────────────────────────┘
        │  PR required
        ▼
 ┌─────────────────────────────┐
 │  main 🔒                     │  ← PR + 1 approval required
 └─────────────────────────────┘
```

**Enforced by:** Rulesets (Settings → Rules → Rulesets) + Branch Protection Rules (Settings → Branches), both configured identically, bypass lists empty, "Do not allow bypassing" enabled.
