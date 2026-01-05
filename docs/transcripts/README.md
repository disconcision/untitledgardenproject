# Conversation Transcripts

This folder stores transcripts of development conversations with AI agents.

## Why Keep Transcripts?

Conversations contain valuable context that doesn't make it into code or docs:
- Design discussions and rejected approaches
- Clarifications of intent
- Debugging sessions
- Exploratory thinking

This context is **lost** when sessions end unless explicitly saved.

## How to Save Transcripts

### After Each Significant Session

1. **In Cursor**: Use the export/copy feature to save the conversation
   - Click the menu in the chat panel
   - Select "Export" or copy the conversation
   
2. **Save to this folder** with naming convention:
   ```
   YYYY-MM-DD-topic.md
   ```
   
   Examples:
   - `2026-01-05-day-night-cycle.md`
   - `2026-01-05-process-restructure.md`
   - `2026-01-06-bug-fix-hover.md`

3. **Add a summary header** (optional but helpful):
   ```markdown
   # Session: Day/Night Cycle Implementation
   
   **Date**: 2026-01-05
   **Duration**: ~45 minutes
   **Outcome**: Implemented OKLCH color interpolation, TimeConfig panel
   
   ## Summary
   - Discussed perceptual color spaces
   - Chose OKLCH over HSL for smoother transitions
   - Added golden hour warmth effect
   
   ---
   
   [Full transcript below]
   ```

## When to Save

Save transcripts for:
- **Feature development** sessions
- **Significant debugging** sessions
- **Architecture/design discussions**
- **Process/workflow discussions** (like this one!)

Skip transcripts for:
- Quick one-off questions
- Trivial fixes
- Sessions where nothing notable was discussed

## File Format

Markdown is preferred. Raw text is acceptable.

The exact format from Cursor's export is fine — the goal is retention, not perfection.

---

_This folder is maintained by the creator (human), not agents._

