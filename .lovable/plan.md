

## Replace Strategy Notes with Recent Conversation Context

### Problem
- The "save to memory" feature relies on the AI outputting special markers (`:::SAVE_SUMMARY:::`), which is unreliable — your last saved note was from March 27 despite using it today.
- Full conversations are already stored in `ai_conversations` with timestamps.
- Maintaining a separate `strategy_notes` table adds complexity for little value.

### Approach
Instead of strategy_notes, automatically pull the last 1-2 conversations from `ai_conversations` and inject their assistant responses as context into new AI sessions. This is zero-effort for you — no "save" button needed.

### Changes

**1. Edge function (`analyze-metrics/index.ts`)**
- Remove `strategyNotes` from the input payload
- Accept a new `recentConversations` field (array of `{title, messages, created_at}`)
- Replace the "Previous Strategic Memory" context block with a "Recent Session Context" block that summarizes the last 1-2 conversations (just the assistant messages, trimmed to ~2000 chars each to manage token usage)
- Remove the `:::SAVE_SUMMARY:::` / `:::END_SUMMARY:::` instructions from the system prompt

**2. AIInsights component (`src/components/AIInsights.tsx`)**
- Remove `fetchStrategyNotes`, `saveSummaryNote`, `handleStreamComplete` summary extraction, `deleteNote`, and all strategy_notes state
- In `fetchDataPayload`, query `ai_conversations` for the 2 most recent conversations (excluding the current one) and attach them to the payload as `recentConversations`
- Remove the "Memory" tab/UI from the panel (the notes list, delete buttons, etc.)
- Remove the `extractAndCleanSummary` helper

**3. Optional cleanup**
- Drop the `strategy_notes` table via migration (can do later if you want to keep old notes for reference)

### What you get
- Every AI session automatically has context from your last 1-2 conversations — no manual "save" step
- Simpler UI without the memory management tab
- More reliable continuity between sessions

