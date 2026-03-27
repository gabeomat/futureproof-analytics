

## Smart Strategic Memory with Dated Summaries

### What We're Building

A "Strategic Memory" system where the AI distills and saves key insights on command, tagged with dates so future analyses know how recent each insight is. This replaces bloated full-conversation context with concise, timestamped notes.

### How It Works

```text
User says "save this" / "summarize and save" during chat
    ↓
AI produces a concise summary wrapped in :::SAVE_SUMMARY::: markers
    ↓
Frontend extracts summary, saves to strategy_notes with timestamp
    ↓
Future analyses: all strategy_notes loaded with dates
    → injected as "Strategic Memory (saved March 27, 2026): ..."
    → AI references past decisions with temporal awareness
```

### Implementation Steps

1. **Create `strategy_notes` table**
   - Columns: `id` (uuid), `summary` (text), `source_conversation_id` (nullable uuid ref to ai_conversations), `created_at` (timestamptz)
   - Open RLS policy (matches existing tables)

2. **Update edge function `analyze-metrics/index.ts`**
   - Add to system prompt: instructions to recognize "save this", "summarize and save", "remember this" triggers
   - When triggered, AI wraps its distilled summary in `:::SAVE_SUMMARY:::` markers
   - Accept `strategyNotes` array in the request body
   - Inject past notes into data context with formatted dates: `"Strategy Note (March 27, 2026): ..."`

3. **Update `AIInsights.tsx`**
   - On initial analysis and follow-ups, fetch all `strategy_notes` ordered by `created_at` and include in payload as `strategyNotes`
   - After each streamed response, check for `:::SAVE_SUMMARY:::` markers
   - If found: extract summary text, insert into `strategy_notes` with `source_conversation_id`, show toast confirmation, render the summary portion cleanly (strip markers)
   - Add a small "Saved Notes" indicator or section in the History view so users can see what's been memorized

### Technical Details

- Dates formatted as human-readable strings in the AI context (e.g., "March 27, 2026") so the AI can reason about recency ("3 months ago we decided to raise prices...")
- `created_at` uses default `now()` — no manual date input needed
- Strategy notes are compact (~200-500 words each) vs full conversations (5000+ words)
- No new edge functions — extends existing `analyze-metrics`

