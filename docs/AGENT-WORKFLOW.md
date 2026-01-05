# Agent Workflow — Mandatory Process

> **⚠️ STOP: Every agent making changes MUST follow this workflow.**  
> This applies to all feature work, bug fixes, and improvements.  
> **Skipping steps creates problems for future agents and the creator.**

---

## Phase 0: Parse the Request

**Before doing anything else**, analyze what the user is asking for:

### 1. Identify Distinct Tasks

The creator may give you an "unstructured blob" of requests. Your first job is to separate these into distinct, atomic tasks:

- Read through the entire request
- List out each distinct fix, feature, or improvement
- Note which tasks are related vs. truly orthogonal
- Consider dependencies between tasks

**Example**: "Fix the hover bug, also add a zoom indicator, and update the tutorial" becomes:

1. `fix/hover-bug` — Fix the hover bug
2. `feat/zoom-indicator` — Add zoom indicator
3. `docs/tutorial-update` — Update tutorial

### 2. Plan Your Git Strategy

For a single conversation with multiple tasks:

| Scenario                    | Strategy                                           |
| --------------------------- | -------------------------------------------------- |
| 2-3 small related fixes     | One branch, separate commits per fix               |
| Multiple unrelated features | Separate branches, merge each before starting next |
| One coherent feature        | One branch, atomic commits                         |
| Mix of fixes + feature      | Fix branch first, merge, then feature branch       |

**Minimum standard**: One branch per conversation with descriptive commits for each logical change.

**Preferred**: Separate branches for truly orthogonal work, so each can be reverted independently.

---

## Phase 1: Before Starting Work

### 3. Understand Context

```bash
# Read the docs in order:
docs/README.md      # Entry point (you're probably past this)
docs/TODO.md        # What's in progress, what's available
SOURCE.md           # Vision, architecture, aesthetic (skim if familiar)
```

### 5. Claim Your Task

In `docs/TODO.md`:

- Move your task to "In Progress"
- Add date: `- [ ] **[YYYY-MM-DD]** Task description`
- If the task doesn't exist, add it first

### 6. Create a Feature Branch

```bash
git checkout main && git pull
git checkout -b feature/<short-descriptive-name>
```

Use descriptive names:

- `feature/camera-animation`
- `feature/ecosystem-humidity`
- `fix/hover-z-index`
- `refactor/plant-generation`

---

## Phase 2: During Work

### 7. Make Focused Changes

- **1–3 coherent improvements** per session, not scattered edits
- Keep commits small and atomic
- **Commit after each logical unit of work** — don't batch unrelated changes
- If you notice unrelated issues, note them in TODO.md for later

### 8. Test in Browser

- Use Cursor's browser tools to verify changes work visually
- Check console for errors
- Verify the change does what you intended

### 9. Check for Lint Errors

Run `read_lints` on modified files. Fix any issues you introduced.

---

## Phase 3: After Completing Work

### 10. Update Documentation

| Change Type    | Update TODO.md? | Update CHECKPOINTS.md? | Update SOURCE.md? | Review Tutorial?     |
| -------------- | --------------- | ---------------------- | ----------------- | -------------------- |
| Any change     | ✓ Always        | If significant         | If architectural  | If user-facing       |
| New feature    | ✓               | ✓ (with tour path)     | Maybe             | ✓ (add steps)        |
| Bug fix        | ✓               | Optional               | No                | If affects UI        |
| Refactoring    | ✓               | No                     | Maybe             | No                   |
| Visual polish  | ✓               | Optional               | No                | Maybe                |
| UI interaction | ✓               | Optional               | No                | ✓ (add/update steps) |

**CHECKPOINTS.md** — Add entry if this is a notable feature:

- Tour path (2-5 verification steps)
- Architecture notes (why, not just what)

**Tutorial (src/core/model.ts)** — Review if you added user-facing features:

- Add new tutorial steps for new interactions
- Remove `isNew` flags from steps that are no longer new
- Ensure tutorial steps have corresponding completion hooks in `update.ts`
- Verify steps actually complete when the user performs the action

**SOURCE.md** — Update if you made:

- Architectural decisions
- New dependencies/libraries
- UI/UX pattern changes

### 11. Commit with Clear Message

```bash
git add -A
git commit -m "feat: <what you did>"
```

Use conventional commits:

- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructure (no behavior change)
- `docs:` — Documentation only
- `chore:` — Maintenance, cleanup

**For multiple fixes in one branch**, commit each separately:

```bash
git add <files-for-fix-1> && git commit -m "fix: first issue"
git add <files-for-fix-2> && git commit -m "fix: second issue"
```

### 12. Merge to Main

```bash
git checkout main && git pull
git merge feature/<branch-name>
git push
```

Handle merge conflicts if they arise from parallel work.

### 13. Delete the Feature Branch

```bash
git branch -d feature/<branch-name>
```

**This step is mandatory.** Stale branches create confusion.

---

## ⛔ STOP — Final Validation

**Before returning to the user, verify you have completed the workflow:**

### Git Checklist

- [ ] Created a feature branch (not working directly on main)
- [ ] Made atomic commits with clear messages
- [ ] Merged branch to main
- [ ] Pushed to origin
- [ ] Deleted the feature branch

### Documentation Checklist

- [ ] TODO.md updated (task claimed at start, marked complete at end)
- [ ] CHECKPOINTS.md updated (if significant feature)
- [ ] Tutorial reviewed (if user-facing change)

### Quality Checklist

- [ ] Tested changes in browser
- [ ] No lint errors (`read_lints` on modified files)
- [ ] No console errors

**If any of these are incomplete, do them now before responding to the user.**

---

## Phase 4: Completion Report

**After passing validation, provide a completion report to the creator.**

### Template

```
## Completion Report

### What I Did
- [Brief description of changes]

### Git Status
- Branch: `feature/xxx` → merged to `main`
- Commits: [number] commits
- Branch deleted: ✓ / ✗

### Documentation Updated
- [ ] TODO.md — task marked complete
- [ ] CHECKPOINTS.md — entry added (if applicable)
- [ ] SOURCE.md — updated (if applicable)

### Verification
- [ ] Tested in browser
- [ ] No lint errors
- [ ] No console errors

### Manual Steps for Creator
- [List anything the human needs to do, or "None"]

### Notes / Observations
- [Anything noteworthy: issues found, suggestions, questions]
```

### Example

```
## Completion Report

### What I Did
- Added smooth camera focus animation with spring physics
- Updated tutorial step 5 to reflect new animation

### Git Status
- Branch: `feature/camera-animation` → merged to `main`
- Commits: 2 commits
- Branch deleted: ✓

### Documentation Updated
- [x] TODO.md — "Smooth animated camera focus transition" moved to Completed
- [x] CHECKPOINTS.md — CP-016 added with tour path
- [ ] SOURCE.md — no changes needed

### Verification
- [x] Tested in browser
- [x] No lint errors
- [x] No console errors

### Manual Steps for Creator
- None

### Notes / Observations
- Noticed the TimeConfig panel could use keyboard shortcuts — added to TODO backlog
```

---

## Meta-Checklist (Self-Check Before Ending)

Run through this mentally before providing your completion report:

1. **Did I claim my task in TODO.md at the start?**
2. **Did I create and later delete a feature branch?**
3. **Did I update TODO.md with completion status?**
4. **If this was significant, did I add a CHECKPOINTS.md entry?**
5. **Did I test the changes in the browser?**
6. **Are there any stale branches I should clean up?**
7. **Is there anything the creator needs to do manually?**

---

## Tutorial Maintenance

The tutorial pane (`src/core/model.ts`) needs to stay in sync with actual features. When you add or modify user-facing interactions:

### Adding New Features

1. **Add tutorial step** in `createInitialWorld()` → `tutorial.sections`
2. **Add completion hook** in `update.ts` for the relevant message type
3. **Mark as `isNew: true`** to highlight the feature (section and/or step)

### After Your Changes

1. **Remove `isNew` flags** from steps that were previously marked new (by you or earlier agents)
2. **Verify completion works** — test in browser that the step checks off when performed
3. **Clean up stale steps** — if a feature was removed, remove its tutorial step

### Completion Hook Pattern

Tutorial steps complete via `completeTutorialStep()` in message handlers:

```typescript
case "someAction": {
  return {
    ...world,
    // ... other state changes ...
    tutorial: completeTutorialStep(world.tutorial, "step-id"),
  };
}
```

For panel-based steps, dispatch a panel open message when the panel opens:

```typescript
const handleToggle = (): void => {
  const willOpen = !isOpen;
  setIsOpen(willOpen);
  if (willOpen) {
    dispatch({ type: "panel/openSomething" });
  }
};
```

---

## Special Cases

### Multiple Tasks in One Conversation

This is common — the creator often gives a batch of requests. Handle it systematically:

**Option A: One Branch, Multiple Commits** (for related or small fixes)

```bash
git checkout -b fix/session-2026-01-05
# Fix issue 1
git add <files> && git commit -m "fix: first issue"
# Fix issue 2
git add <files> && git commit -m "fix: second issue"
# Merge when all done
git checkout main && git merge fix/session-2026-01-05
```

**Option B: Separate Branches** (for unrelated features)

```bash
# Feature 1
git checkout -b feat/zoom-indicator
# ... work ...
git commit -m "feat: add zoom indicator"
git checkout main && git merge feat/zoom-indicator && git branch -d feat/zoom-indicator

# Feature 2
git checkout -b fix/hover-bug
# ... work ...
git commit -m "fix: hover z-index"
git checkout main && git merge fix/hover-bug && git branch -d fix/hover-bug
```

**When to use which:**

- **Option A**: Fixes are small, won't need individual reverts
- **Option B**: Changes are significant, might need to revert one without the other

### Long-Running Work

If work spans multiple sessions:

- Keep the branch open
- Note "Work in progress" in TODO.md
- Commit frequently (even incomplete work)

### Discovering Bugs or Issues

If you notice something unrelated to your task:

- Add it to TODO.md under "Up Next" or appropriate backlog section
- Don't fix it in this branch (unless trivial)
- Mention it in your completion report

### Parallel Agent Work

If another agent might be working simultaneously:

- Check TODO.md "In Progress" section first
- Avoid claiming the same files
- Pull before merging to catch conflicts early

---

## Quick Reference

```
PARSE:
  # Read user request
  # Identify distinct tasks
  # Plan git strategy (one branch? multiple?)

START:
  git checkout main && git pull
  git checkout -b feature/xxx
  # Update TODO.md — claim task

WORK:
  # Make changes
  # Commit each logical unit separately
  # Test in browser
  # Check lints

VALIDATE (before responding!):
  ☐ Branch created?
  ☐ Commits made?
  ☐ TODO.md updated?
  ☐ Tutorial reviewed (if UI change)?
  ☐ Tested in browser?

FINISH:
  # Update TODO.md — mark complete
  # Update CHECKPOINTS.md if significant
  git checkout main && git pull
  git merge feature/xxx
  git push
  git branch -d feature/xxx
  # Provide completion report
```

---

_This workflow exists to prevent context loss and enable parallel work. **Following it is not optional.**_
