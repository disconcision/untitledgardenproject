# Agent Workflow

> **The checklist in `.cursor/rules/checklist.mdc` is always loaded.** This doc has more detail if you need it.

---

## Quick Start

```bash
# 1. Start on main, create branch
git checkout main && git pull
git checkout -b feature/<descriptive-name>

# 2. Claim task in docs/TODO.md

# 3. Do work, commit atomically
git add <files> && git commit -m "feat: description"

# 4. When done: update TODO.md, merge, delete branch
git checkout main && git merge feature/<branch-name>
git branch -d feature/<branch-name>
```

---

## Using Plan Mode (Recommended)

For complex sessions, start with **Plan Mode** (`Shift+Tab` in agent input):

1. Press `Shift+Tab` before describing your task
2. Answer clarifying questions
3. Review the generated plan
4. Optionally save to a file (e.g., `docs/sessions/2026-01-05-topic.md`)
5. Execute the plan

This creates a structured plan the agent can reference throughout the session.

---

## Git Strategy

| Scenario | Strategy |
|----------|----------|
| 2-3 small related fixes | One branch, separate commits per fix |
| Multiple unrelated features | Separate branches, merge each before starting next |
| One coherent feature | One branch, atomic commits |

**Conventional commit prefixes**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

---

## Documentation Updates

| Change Type | TODO.md | SOURCE.md | Tutorial |
|-------------|---------|-----------|----------|
| Any change | ✓ Always | If architectural | If user-facing |
| New feature | ✓ | Maybe | ✓ Add steps |
| Bug fix | ✓ | No | If affects UI |
| Refactoring | ✓ | Maybe | No |

---

## Tutorial Maintenance

When adding user-facing features:

1. Add tutorial step in `createInitialWorld()` → `tutorial.sections`
2. Add completion hook in `update.ts` 
3. Mark new steps with `isNew: true`
4. Clear `isNew` from old steps when adding new ones

---

## Completion Report

After work, provide a brief report:

```
## Done
- [What you did]

## Git
- Branch: `feature/xxx` → merged to main, deleted

## Docs  
- TODO.md: [updated / N/A]
- Tutorial: [added step / N/A]

## Notes
- [Anything for future reference]
```

---

## Special Cases

**Multiple tasks in one conversation**: Either one branch with separate commits, or separate branches merged sequentially.

**Discovering unrelated bugs**: Add to TODO.md backlog, don't fix in current branch.

**Long-running work**: Keep branch open, note "WIP" in TODO.md, commit frequently.

---

_The `.cursor/rules/checklist.mdc` file is auto-injected into every conversation. This doc is supplementary._
