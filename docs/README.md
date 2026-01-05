# Hanging Garden — Documentation Index

> **⚠️ Agents: Start here.** This is your entry point to the project.

## Quick Start for Agents

**Before doing any work, you MUST read the workflow documentation:**

```
1. Read this file (docs/README.md) — you're here
2. Read docs/AGENT-WORKFLOW.md — MANDATORY, contains git process
3. Check docs/TODO.md — claim your task before starting
4. Skim SOURCE.md — project vision and architecture
```

### Why This Matters

- Multiple agents may work on this project in parallel
- Proper git hygiene prevents conflicts and enables clean reverts
- The creator needs a comprehensible commit history
- **Skipping the workflow creates problems for everyone**

## Documentation Map

| File                       | Purpose                                                    | When to Update                       |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| **docs/README.md**         | This index; entry point for agents                         | When doc structure changes           |
| **docs/AGENT-WORKFLOW.md** | Mandatory workflow, git practices, completion checklist    | When process changes                 |
| **docs/TODO.md**           | Active tasks, in-progress work, backlog                    | Every session (claim/complete tasks) |
| **docs/CHECKPOINTS.md**    | Tour paths and architecture notes for significant changes  | Major features only                  |
| **docs/transcripts/**      | Conversation transcripts (creator-maintained)              | Creator exports after sessions       |
| **SOURCE.md**              | Project vision, design, architecture, aesthetic references | Architectural decisions              |

## For the Creator (Human)

### Your Process

1. **Starting a session**: Tell the agent "Read docs/README.md" (or it may already be in context)
2. **During work**: Give feedback, steer direction
3. **After session**: Export conversation transcript to `docs/transcripts/YYYY-MM-DD-topic.md`

### What to Check When Agent Finishes

The agent should provide a **Completion Report** at the end of work. Look for:

- [ ] Code changes committed?
- [ ] Branch merged and deleted?
- [ ] TODO.md updated?
- [ ] CHECKPOINTS.md updated (if significant feature)?
- [ ] Any manual steps for you?

If the agent didn't provide this, ask: "Give me your completion report."

## Key Principles

1. **Always use feature branches** — Never commit directly to main
2. **Small, focused commits** — One logical change per commit
3. **Separate unrelated work** — Different fixes get different commits (or branches)
4. **Claim tasks before starting** — Prevents parallel conflicts
5. **Update docs as you go** — Not as an afterthought
6. **Validate before responding** — Check the workflow checklist before ending

## Non-Negotiables

These are not suggestions. Every session must include:

- [ ] Feature branch created
- [ ] Branch merged and deleted when done
- [ ] TODO.md updated
- [ ] Completion report provided

---

_This file is the first thing agents should read. The workflow is mandatory, not optional._
