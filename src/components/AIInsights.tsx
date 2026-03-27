import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { currentSnapshot, historicalRevenue, historicalChurn, monthlyMembers, annualMembers } from "@/lib/data";
import { toast } from "sonner";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-metrics`;

export function AIInsights() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const runAnalysis = async () => {
    setOpen(true);
    setLoading(true);
    setContent("");

    try {
      // Fetch live data from database
      const [{ data: dailyMetrics }, { data: monthlyRevenue }] = await Promise.all([
        supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(30),
        supabase.from("monthly_revenue").select("*").order("month", { ascending: false }).limit(12),
      ]);

      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          snapshot: currentSnapshot,
          historicalRevenue,
          churnData: historicalChurn,
          monthlyMembers,
          annualMembers,
          dailyMetrics,
          monthlyRevenue,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Analysis failed" }));
        toast.error(err.error || "Analysis failed");
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

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
            if (delta) {
              fullContent += delta;
              setContent(fullContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to run AI analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={runAnalysis} variant="outline" size="sm" className="gap-1.5">
        <Brain className="w-4 h-4" />
        AI Insights
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Strategic AI Analysis
            </SheetTitle>
            <SheetDescription>
              Powered by deep reasoning AI — analyzing your MRR, churn, pricing & growth data
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
            {loading && !content && (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your metrics…
              </div>
            )}
            {content && <ReactMarkdown>{content}</ReactMarkdown>}
            {loading && content && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-0.5" />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
