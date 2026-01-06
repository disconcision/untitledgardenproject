# Hanging Garden — Documentation

> **Humans: Start here.** This is your entry point.

PLAY HERE: https://andrewblinn.com/untitledgardenproject/

> **Agents: Start here.** A checklist is auto-loaded from `.cursor/rules/checklist.mdc`.

---

## What Is This?

A browser-based software toy: a floating garden of algorithmic plants, soil clumps, and stones drifting in airy space. The garden is an **editor** — the visual form _is_ the syntax. You grow plants by interacting with them directly.

**Current state**: Plants grow autonomously, day/night cycle, multiple floating clusters, particles (seeds, fireflies). Core interactions work. Audio system not yet implemented.

**Aesthetic**: Temperate rainforest. Dense, quiet, textural. Rich greens, volcanic grays, warm earth tones. Not dark by default — this is a garden, not a terminal.

---

## Documentation Map

| File | What It Is |
|------|-----------|
| **docs/README.md** | This file — entry point |
| **docs/AGENT-WORKFLOW.md** | Git process, completion reports |
| **docs/TODO.md** | Tasks, milestones, backlog |
| **SOURCE.md** | Vision, architecture, aesthetics |
| **.cursor/rules/checklist.mdc** | Always-on checklist (auto-injected) |

---

## Quick Start for Agents

### For Complex Sessions: Use Plan Mode

1. Press `Shift+Tab` in agent input before describing task
2. Answer clarifying questions
3. Review generated plan
4. Execute (plan can be saved to `docs/sessions/` if useful)

### For Simple Tasks

```bash
git checkout main && git pull
git checkout -b feature/<descriptive-name>
# Claim task in docs/TODO.md
# Do work
# Update TODO.md, merge, delete branch
```

---

## For the Creator (Human)

**Your loop**:
1. Tell agent "Read docs/README.md" (or it reads automatically)
2. For complex work: Ask agent to use Plan Mode (`Shift+Tab`)
3. Give feedback while viewing the garden
4. After session: optionally export transcript to `docs/transcripts/`

**What to check when agent finishes**:
- [ ] Code committed + merged?
- [ ] TODO.md updated?
- [ ] Brief completion report provided?

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
- [ ] Commit changes with clear messages
- [ ] Merge branch and delete it
- [ ] Provide completion report
- [ ] Update TODO.md

These are in `.cursor/rules/checklist.mdc` — always visible.

---

_Read docs/AGENT-WORKFLOW.md for more detail if needed._
