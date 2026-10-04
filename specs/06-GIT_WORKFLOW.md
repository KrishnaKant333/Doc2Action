# Specification 06: Git Workflow & Collaboration

**Project:** Document → Action Automator  
**Status:** Approved Workflow Standard  

---

## 1. Branching Model & Lifecycle

All team members follow a feature branch workflow to protect `main`:

```
main (Production / Stable)
 │
 ├──► create branch: frontend/<name> or backend/<name>
 │     │
 │     ├──► local development
 │     ├──► local verification (npm run lint && npm run build)
 │     ├──► focused logical commits
 │     │
 │     └──► push branch to origin
 │           │
 │           └──► open Pull Request to main
 │                 │
 │                 ├──► team review & validation
 │                 └──► merge into main
```

---

## 2. Branch Naming Conventions

- **Frontend Features / Fixes:** `frontend/<name>` (e.g. `frontend/yash`)
- **Backend Features / Fixes:** `backend/<name>`
- **Documentation / Specs:** `docs/<name>` or within feature branch during designated phase

---

## 3. Strict Collaboration Rules

1. **Never Commit Directly to `main`:**
   - The `main` branch is reserved for verified, stable increments.
2. **Pull Latest `main` Before New Phases:**
   - Always run `git pull origin main` before branching or beginning a new development increment.
3. **Focused, Logical Commits:**
   - One commit should represent one complete logical piece of work.
   - Do not bundle unrelated refactorings or stylistic tweaks into feature commits.
4. **Descriptive Commit Messages:**
   - Use standard conventional prefixes:
     - `docs:` Documentation updates
     - `feat:` New user-facing feature
     - `fix:` Bug fix
     - `chore:` Configuration or maintenance
     - `refactor:` Code restructuring without behavioral change
   - Example: `docs: establish project context and specifications`
5. **Pre-Commit Verification:**
   - Before committing, ensure the project builds cleanly without errors:
     ```bash
     npm run lint
     npm run build
     ```
6. **Pull Requests Required:**
   - All code merges to `main` must happen via PR with clear descriptions of what was added and how to test it.
