import { useState, useRef, useEffect, useCallback } from "react";
import { Brain, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { currentSnapshot, historicalRevenue, historicalChurn, monthlyMembers, annualMembers } from "@/lib/data";
import { toast } from "sonner";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-metrics`;

type Msg = { role: "user" | "assistant"; content: string };

async function streamResponse(
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const resp = await fetch(ANALYZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error || "Analysis failed");
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

export function AIInsights() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [dataPayload, setDataPayload] = useState<Record<string, unknown> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const assistantContentRef = useRef("");

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchDataPayload = async () => {
    const [{ data: dailyMetrics }, { data: monthlyRevenue }] = await Promise.all([
      supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("monthly_revenue").select("*").order("month", { ascending: false }).limit(12),
    ]);
    const payload = {
      snapshot: currentSnapshot,
      historicalRevenue,
      churnData: historicalChurn,
      monthlyMembers,
      annualMembers,
      dailyMetrics,
      monthlyRevenue,
    };
    setDataPayload(payload);
    return payload;
  };

  const runInitialAnalysis = async () => {
    setOpen(true);
    setLoading(true);
    setMessages([]);
    assistantContentRef.current = "";

    try {
      const payload = await fetchDataPayload();

      await streamResponse(
        payload,
        (delta) => {
          assistantContentRef.current += delta;
          const content = assistantContentRef.current;
          setMessages([{ role: "assistant", content }]);
        },
        () => setLoading(false),
      );
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to run AI analysis");
      setLoading(false);
    }
  };

  const sendFollowUp = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Msg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    assistantContentRef.current = "";

    try {
      const payload = dataPayload || (await fetchDataPayload());

      // Send conversation history (skip the first assistant msg which was the initial analysis response)
      // The edge function re-generates the initial data prompt, so we send all messages as context
      await streamResponse(
        { ...payload, messages: updatedMessages },
        (delta) => {
          assistantContentRef.current += delta;
          const content = assistantContentRef.current;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
            }
            return [...prev, { role: "assistant", content }];
          });
        },
        () => setLoading(false),
      );
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to send message");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendFollowUp();
    }
  };

  return (
    <>
      <Button onClick={runInitialAnalysis} variant="outline" size="sm" className="gap-1.5">
        <Brain className="w-4 h-4" />
        AI Insights
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
          <div className="p-6 pb-0">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Strategic AI Analysis
              </SheetTitle>
              <SheetDescription>
                Powered by deep reasoning AI — ask follow-up questions about your data
              </SheetDescription>
            </SheetHeader>
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {messages.length === 0 && loading && (
                <div className="flex items-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your metrics…
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={
                    msg.role === "user"
                      ? "flex justify-end"
                      : ""
                  }
                >
                  {msg.role === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%] text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {loading && i === messages.length - 1 && (
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-0.5" />
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {messages.length > 0 && (
            <div className="border-t p-4 flex gap-2">
              <Input
                placeholder="Ask a follow-up question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1"
              />
              <Button size="icon" onClick={sendFollowUp} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
