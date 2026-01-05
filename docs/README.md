# Hanging Garden — Documentation Index

> **Agents: Start here.** This is your entry point to the project.

## Quick Start for Agents

Before doing any work:

```
1. Read this file (docs/README.md)
2. Read docs/AGENT-WORKFLOW.md for the mandatory process
3. Check docs/TODO.md for current tasks and what's in progress
4. Skim SOURCE.md for project vision and architecture
```

## Documentation Map

| File | Purpose | When to Update |
|------|---------|----------------|
| **docs/README.md** | This index; entry point for agents | When doc structure changes |
| **docs/AGENT-WORKFLOW.md** | Mandatory workflow, git practices, completion checklist | When process changes |
| **docs/TODO.md** | Active tasks, in-progress work, backlog | Every session (claim/complete tasks) |
| **docs/CHECKPOINTS.md** | Tour paths and architecture notes for significant changes | Major features only |
| **docs/transcripts/** | Conversation transcripts (creator-maintained) | Creator exports after sessions |
| **SOURCE.md** | Project vision, design, architecture, aesthetic references | Architectural decisions |

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

1. **Small, focused commits** — Easy to bisect and revert
2. **Claim tasks before starting** — Prevents parallel conflicts
3. **Update docs as you go** — Not as an afterthought
4. **Leave the codebase better than you found it** — Clean up stale branches, fix small issues you notice

---

_This file is the first thing agents should read. Keep it concise and actionable._

