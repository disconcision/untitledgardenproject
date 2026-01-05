# Agent Workflow — Mandatory Process

> **Every agent making changes MUST follow this workflow.**  
> This applies to all feature work, bug fixes, and improvements.

---

## Phase 1: Before Starting Work

### 1. Understand Context

```bash
# Read the docs in order:
docs/README.md      # Entry point (you're probably past this)
docs/TODO.md        # What's in progress, what's available
SOURCE.md           # Vision, architecture, aesthetic (skim if familiar)
```

### 2. Claim Your Task

In `docs/TODO.md`:
- Move your task to "In Progress"
- Add date: `- [ ] **[YYYY-MM-DD]** Task description`
- If the task doesn't exist, add it first

### 3. Create a Feature Branch

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

### 4. Make Focused Changes

- **1–3 coherent improvements** per session, not scattered edits
- Keep commits small and atomic
- If you notice unrelated issues, note them in TODO.md for later

### 5. Test in Browser

- Use Cursor's browser tools to verify changes work visually
- Check console for errors
- Verify the change does what you intended

### 6. Check for Lint Errors

Run `read_lints` on modified files. Fix any issues you introduced.

---

## Phase 3: After Completing Work

### 7. Update Documentation

| Change Type | Update TODO.md? | Update CHECKPOINTS.md? | Update SOURCE.md? |
|-------------|-----------------|------------------------|-------------------|
| Any change | ✓ Always | If significant | If architectural |
| New feature | ✓ | ✓ (with tour path) | Maybe |
| Bug fix | ✓ | Optional | No |
| Refactoring | ✓ | No | Maybe |
| Visual polish | ✓ | Optional | No |

**CHECKPOINTS.md** — Add entry if this is a notable feature:
- Tour path (2-5 verification steps)
- Architecture notes (why, not just what)

**SOURCE.md** — Update if you made:
- Architectural decisions
- New dependencies/libraries
- UI/UX pattern changes

### 8. Commit with Clear Message

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

### 9. Merge to Main

```bash
git checkout main && git pull
git merge feature/<branch-name>
git push
```

Handle merge conflicts if they arise from parallel work.

### 10. Delete the Feature Branch

```bash
git branch -d feature/<branch-name>
```

**This step is mandatory.** Stale branches create confusion.

---

## Phase 4: Completion Report

**Before ending your session, provide a completion report to the creator.**

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

## Special Cases

### Multiple Orthogonal Changes

If you're asked to do two unrelated things:
- Create separate branches for each
- Merge each independently
- This keeps history clean for bisecting

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
START:
  git checkout main && git pull
  git checkout -b feature/xxx
  # Update TODO.md — claim task

WORK:
  # Make changes
  # Test in browser
  # Check lints

FINISH:
  # Update TODO.md — mark complete
  # Update CHECKPOINTS.md if significant
  git add -A && git commit -m "feat: xxx"
  git checkout main && git pull
  git merge feature/xxx
  git push
  git branch -d feature/xxx
  # Provide completion report
```

---

_This workflow exists to prevent context loss and enable parallel work. Follow it consistently._

