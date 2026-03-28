import { useState, useRef, useEffect, useCallback } from "react";
import { Brain, Loader2, Send, History, Plus, Trash2, BookMarked, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { currentSnapshot, historicalRevenue, historicalChurn, monthlyMembers, annualMembers } from "@/lib/data";
import { toast } from "sonner";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-metrics`;

type Msg = { role: "user" | "assistant"; content: string; imageUrls?: string[] };
type Conversation = { id: string; title: string; messages: Msg[]; created_at: string; updated_at: string };
type StrategyNote = { id: string; summary: string; created_at: string };

const SAVE_START = ":::SAVE_SUMMARY:::";
const SAVE_END = ":::END_SUMMARY:::";

function extractAndCleanSummary(content: string): { cleanContent: string; summary: string | null } {
  const startIdx = content.indexOf(SAVE_START);
  const endIdx = content.indexOf(SAVE_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { cleanContent: content, summary: null };
  }
  const summary = content.slice(startIdx + SAVE_START.length, endIdx).trim();
  const cleanContent = (content.slice(0, startIdx) + content.slice(endIdx + SAVE_END.length)).trim();
  return { cleanContent, summary };
}

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
  const [view, setView] = useState<"chat" | "history" | "notes">("chat");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [dataPayload, setDataPayload] = useState<Record<string, unknown> | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [strategyNotes, setStrategyNotes] = useState<StrategyNote[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ url: string; name: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assistantContentRef = useRef("");

  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("chat-uploads").upload(path, file);
    if (error) {
      toast.error("Failed to upload image");
      return;
    }
    const { data: urlData } = supabase.storage.from("chat-uploads").getPublicUrl(path);
    setPendingImages((prev) => [...prev, { url: urlData.publicUrl, name: file.name }]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large (max 10 MB)`);
        continue;
      }
      await uploadImage(file);
    }
    e.target.value = "";
  };

  const removePendingImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchStrategyNotes = async () => {
    const { data } = await supabase
      .from("strategy_notes")
      .select("id, summary, created_at")
      .order("created_at", { ascending: true });
    const notes = (data as unknown as StrategyNote[]) || [];
    setStrategyNotes(notes);
    return notes;
  };

  const fetchDataPayload = async () => {
    const [{ data: dailyMetrics }, { data: monthlyRevenue }, { data: acquisitionData }, notes] = await Promise.all([
      supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("monthly_revenue").select("*").order("month", { ascending: false }).limit(12),
      supabase.from("daily_acquisitions").select("*").order("date", { ascending: false }).limit(60),
      fetchStrategyNotes(),
    ]);
    // Compute real rolling 30-day ad spend from acquisition data
    let rolling30AdSpend = 0;
    if (acquisitionData && acquisitionData.length > 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      for (const row of acquisitionData) {
        if (row.date >= thirtyDaysAgo) {
          rolling30AdSpend += Number(row.ad_spend);
        }
      }
    }

    const snapshotOverride = {
      ...currentSnapshot,
      ...(rolling30AdSpend > 0 ? { monthlyAdSpend: rolling30AdSpend } : {}),
    };

    const payload = {
      snapshot: snapshotOverride,
      historicalRevenue,
      churnData: historicalChurn,
      monthlyMembers,
      annualMembers,
      dailyMetrics,
      monthlyRevenue,
      acquisitionData,
      strategyNotes: notes,
    };
    setDataPayload(payload);
    return payload;
  };

  const saveSummaryNote = async (summary: string, convId: string | null) => {
    await supabase.from("strategy_notes").insert([
      {
        summary,
        source_conversation_id: convId,
      },
    ]);
    toast.success("Strategic note saved to memory");
    await fetchStrategyNotes();
  };

  const handleStreamComplete = async (rawContent: string, convId: string | null): Promise<string> => {
    const { cleanContent, summary } = extractAndCleanSummary(rawContent);
    if (summary) {
      await saveSummaryNote(summary, convId);
    }
    return cleanContent;
  };

  const saveConversation = async (msgs: Msg[], convId: string | null) => {
    const firstAssistant = msgs.find((m) => m.role === "assistant");
    const titleText = firstAssistant?.content?.slice(0, 80)?.replace(/[#*\n]/g, " ")?.trim() || "Analysis";
    const title = titleText.length > 60 ? titleText.slice(0, 57) + "…" : titleText;

    const messagesJson = JSON.parse(JSON.stringify(msgs));

    if (convId) {
      await supabase
        .from("ai_conversations")
        .update({ messages: messagesJson, title })
        .eq("id", convId);
      return convId;
    } else {
      const { data } = await supabase
        .from("ai_conversations")
        .insert([{ messages: messagesJson, title }])
        .select("id")
        .single();
      const newId = data?.id || null;
      setConversationId(newId);
      return newId;
    }
  };

  const loadConversations = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations((data as unknown as Conversation[]) || []);
    setLoadingHistory(false);
  };

  const openConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setConversationId(conv.id);
    setView("chat");
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("ai_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (conversationId === id) {
      setMessages([]);
      setConversationId(null);
    }
    toast.success("Conversation deleted");
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("strategy_notes").delete().eq("id", id);
    setStrategyNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Strategy note deleted");
  };

  const startNewAnalysis = async () => {
    setView("chat");
    setMessages([]);
    setConversationId(null);
    setLoading(true);
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
        async () => {
          const cleanContent = await handleStreamComplete(assistantContentRef.current, null);
          const finalMsgs: Msg[] = [{ role: "assistant", content: cleanContent }];
          setMessages(finalMsgs);
          setLoading(false);
          await saveConversation(finalMsgs, null);
        },
      );
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to run AI analysis");
      setLoading(false);
    }
  };

  const openPanel = async () => {
    setOpen(true);
    // If we already have messages loaded, just show them
    if (messages.length > 0) return;
    // Try to load the most recent conversation
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);
    const recent = (data as unknown as Conversation[] | null)?.[0];
    if (recent) {
      setMessages(recent.messages);
      setConversationId(recent.id);
      await fetchDataPayload();
    } else {
      await startNewAnalysis();
    }
  };

  const sendFollowUp = async () => {
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;
    if (loading) return;
    const imageUrls = pendingImages.map((p) => p.url);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    const userMsg: Msg = { role: "user", content: text || "Please analyze the attached image(s).", imageUrls: imageUrls.length > 0 ? imageUrls : undefined };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    assistantContentRef.current = "";

    try {
      const payload = dataPayload || (await fetchDataPayload());

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
        async () => {
          const cleanContent = await handleStreamComplete(assistantContentRef.current, conversationId);
          const finalMsgs = [...updatedMessages, { role: "assistant" as const, content: cleanContent }];
          setMessages(finalMsgs);
          setLoading(false);
          await saveConversation(finalMsgs, conversationId);
        },
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

  const showHistory = () => {
    setView("history");
    loadConversations();
  };

  const showNotes = () => {
    setView("notes");
    fetchStrategyNotes();
  };

  return (
    <>
      <Button onClick={openPanel} variant="outline" size="sm" className="gap-1.5">
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
                Say &quot;save this&quot; or &quot;summarize and save&quot; to store key insights for future sessions
              </SheetDescription>
            </SheetHeader>
            <div className="flex gap-2 mt-3">
              <Button
                variant={view === "chat" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("chat")}
                className="gap-1.5"
              >
                <Brain className="w-3.5 h-3.5" />
                Chat
              </Button>
              <Button
                variant={view === "history" ? "default" : "outline"}
                size="sm"
                onClick={showHistory}
                className="gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Button>
              <Button
                variant={view === "notes" ? "default" : "outline"}
                size="sm"
                onClick={showNotes}
                className="gap-1.5"
              >
                <BookMarked className="w-3.5 h-3.5" />
                Memory
                {strategyNotes.length > 0 && (
                  <span className="ml-1 bg-primary/20 text-primary text-xs rounded-full px-1.5">
                    {strategyNotes.length}
                  </span>
                )}
              </Button>
              {view === "chat" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewAnalysis}
                  disabled={loading}
                  className="gap-1.5 ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Analysis
                </Button>
              )}
            </div>
          </div>

          {view === "notes" ? (
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 py-4">
                {strategyNotes.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    No strategic notes saved yet. During a chat, say &quot;save this&quot; to store key insights.
                  </p>
                ) : (
                  strategyNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border border-border bg-accent/30"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => deleteNote(note.id, e)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{note.summary}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : view === "history" ? (
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-2 py-4">
                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading conversations…
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    No saved conversations yet. Start a new analysis!
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.created_at).toLocaleDateString()} · {conv.messages.length} messages
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => deleteConversation(conv.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
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
                      className={msg.role === "user" ? "flex justify-end" : ""}
                    >
                      {msg.role === "user" ? (
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%] text-sm">
                          {msg.imageUrls && msg.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.imageUrls.map((url, j) => (
                                <img key={j} src={url} alt="Uploaded" className="rounded-lg max-h-40 max-w-full object-cover" />
                              ))}
                            </div>
                          )}
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
                <div className="border-t p-4 space-y-2">
                  {pendingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pendingImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img.url} alt={img.name} className="h-16 w-16 rounded-lg object-cover border border-border" />
                          <button
                            onClick={() => removePendingImage(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      title="Attach image"
                    >
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Ask a follow-up question…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button size="icon" onClick={sendFollowUp} disabled={loading || (!input.trim() && pendingImages.length === 0)}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
