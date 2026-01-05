# Hanging Garden — Documentation

> **Agents: Start here.** This is your entry point.

---

## What Is This?

A browser-based software toy: a floating garden of algorithmic plants, soil clumps, and stones drifting in airy space. The garden is an **editor** — the visual form _is_ the syntax. You grow plants by interacting with them directly.

**Current state**: Plants grow autonomously, day/night cycle, multiple floating clusters, particles (seeds, fireflies). Core interactions work. Audio system not yet implemented.

**Aesthetic**: Temperate rainforest. Dense, quiet, textural. Rich greens, volcanic grays, warm earth tones. Not dark by default — this is a garden, not a terminal.

---

## Documentation Map

| File | What It Is | Read If... |
|------|-----------|------------|
| **docs/README.md** | This file — entry point | You're starting here ✓ |
| **docs/AGENT-WORKFLOW.md** | Git process, completion reports | You're about to do work |
| **docs/TODO.md** | Tasks, milestones, backlog | You need something to work on |
| **SOURCE.md** | Vision, architecture, aesthetics | You need design context |
| **docs/CHECKPOINTS.md** | Feature history, tour paths | You need to understand past work |

---

## Quick Start for Agents

### Before Any Work

```bash
# 1. Read docs
cat docs/README.md        # You're here
cat docs/AGENT-WORKFLOW.md  # Mandatory process
cat docs/TODO.md          # Find/claim a task

# 2. Skim SOURCE.md if unfamiliar with project vision

# 3. Create a branch
git checkout main && git pull
git checkout -b feature/<descriptive-name>

# 4. Claim task in docs/TODO.md
```

### After Work

```bash
# 1. Update TODO.md (mark complete)
# 2. Commit with clear message
git add -A && git commit -m "feat: description"

# 3. Merge and clean up
git checkout main && git merge feature/<branch-name>
git branch -d feature/<branch-name>

# 4. Provide completion report (see AGENT-WORKFLOW.md)
```

---

## For the Creator (Human)

**Your loop**:
1. Tell agent "Read docs/README.md"
2. Give feedback while viewing the garden
3. After session: export transcript to `docs/transcripts/`

**What to check when agent finishes**:
- [ ] Code committed + merged?
- [ ] TODO.md updated?
- [ ] Completion report provided?

---

## Key Files

```
src/
├── core/           # Pure logic (runs in Node or browser)
│   ├── model.ts    # Types, World state
│   ├── generate.ts # Procedural generation
│   └── actions/    # sprout, prune, branch
├── render/         # React/SVG (browser only)
├── ui/             # HUD, panels, menus
└── theme/          # Colors, day/night scheme
```

---

## Non-Negotiables

Every agent session must:
- [ ] Create a feature branch (not work on main)
- [ ] Claim task in TODO.md before starting
- [ ] Commit changes with clear messages
- [ ] Merge branch and delete it
- [ ] Provide completion report

**Why?** Clean git history enables easy reverts. Claimed tasks prevent conflicts.

---

_Read docs/AGENT-WORKFLOW.md next for full process details._
