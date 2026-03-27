

## Conversational AI Insights

### What Changes

Turn the current one-shot AI analysis into a back-and-forth chat. The initial analysis stays as the first message, but you can then ask follow-up questions, drill into specific recommendations, or challenge assumptions.

### Architecture

```text
Sheet opens → initial analysis streams as before (assistant msg #1)
    ↓
Chat input appears at bottom of sheet
    ↓
User types follow-up → full message history sent to edge function
    ↓
Edge function forwards conversation history to AI gateway
    ↓
Streamed reply appended as next assistant message
```

### Implementation Steps

1. **Update edge function `analyze-metrics/index.ts`**
   - Accept a `messages` array (full conversation history) in addition to the data payload
   - On first call (no messages), build the data-rich user prompt as today
   - On follow-up calls (messages provided), prepend the system prompt + data context, then append the full conversation history
   - Still streams the response

2. **Rewrite `AIInsights.tsx` as a chat interface**
   - Replace single `content` string with a `messages[]` array (`{role, content}`)
   - First click: fetch data, send to edge function, stream first assistant message into the array
   - Show a text input + send button at the bottom of the sheet
   - On send: append user message to array, call edge function with full history, stream new assistant response
   - Each message rendered with `ReactMarkdown`, user messages styled differently
   - Auto-scroll to bottom on new content
   - Loading indicator on the latest assistant message while streaming

### Technical Details

- Reuses existing edge function (just extended to accept conversation history)
- System prompt + data context injected server-side on every call so the AI always has full business context
- Model stays `google/gemini-2.5-pro` for deep reasoning
- SSE streaming parsing logic stays the same, extracted into a reusable helper

