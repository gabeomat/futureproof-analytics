import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Upload, CalendarDays, TrendingUp, FileUp, Loader2, Megaphone } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// --- Types ---

interface DailyEntry {
  id?: string;
  date: string;
  mrr: number;
  members: number;
  about_page_traffic: number;
  discovery_rank: number;
  profile_activity: number;
  group_activity: number;
}

interface MonthlyEntry {
  id?: string;
  month: string;
  new_revenue: number;
  revenue_churn: number;
}

interface AcquisitionEntry {
  id?: string;
  date: string;
  ad_spend: number;
  ad_conv_27: number;
  ad_conv_47: number;
  ad_conv_333: number;
  organic_27: number;
  organic_47: number;
  organic_333: number;
}

interface CSVUpload {
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  previewHeaders: string[];
  previewRows: string[][];
}

// --- Helpers ---

const todayStr = () => new Date().toISOString().slice(0, 10);

const DAILY_FIELDS: { key: keyof Omit<DailyEntry, "date" | "id">; label: string; placeholder: string }[] = [
  { key: "mrr", label: "MRR ($)", placeholder: "2915" },
  { key: "members", label: "Members", placeholder: "167" },
  { key: "about_page_traffic", label: "About Page Traffic", placeholder: "42" },
  { key: "discovery_rank", label: "Discovery Rank", placeholder: "15" },
  { key: "profile_activity", label: "Profile Activity", placeholder: "85" },
  { key: "group_activity", label: "Group Activity", placeholder: "120" },
];

const EMPTY_DAILY: DailyEntry = { date: todayStr(), mrr: 0, members: 0, about_page_traffic: 0, discovery_rank: 0, profile_activity: 0, group_activity: 0 };
const EMPTY_MONTHLY: MonthlyEntry = { month: "", new_revenue: 0, revenue_churn: 0 };
const EMPTY_ACQ: AcquisitionEntry = { date: todayStr(), ad_spend: 0, ad_conv_27: 0, ad_conv_47: 0, ad_conv_333: 0, organic_27: 0, organic_47: 0, organic_333: 0 };

// --- Component ---

export function DataEntry() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Daily state
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [dailyDraft, setDailyDraft] = useState<DailyEntry>({ ...EMPTY_DAILY });
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailySaving, setDailySaving] = useState(false);

  // Monthly state
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [monthlyDraft, setMonthlyDraft] = useState<MonthlyEntry>({ ...EMPTY_MONTHLY });
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlySaving, setMonthlySaving] = useState(false);

  // Acquisition state
  const [acqEntries, setAcqEntries] = useState<AcquisitionEntry[]>([]);
  const [acqDraft, setAcqDraft] = useState<AcquisitionEntry>({ ...EMPTY_ACQ });
  const [showAcqForm, setShowAcqForm] = useState(false);
  const [acqLoading, setAcqLoading] = useState(true);
  const [acqSaving, setAcqSaving] = useState(false);

  // CSV state
  const [csvData, setCsvData] = useState<CSVUpload | null>(null);

  // --- Load data on mount ---
  useEffect(() => {
    loadDaily();
    loadMonthly();
    loadAcquisitions();
  }, []);

  const loadDaily = async () => {
    setDailyLoading(true);
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast({ title: "Failed to load daily metrics", description: error.message, variant: "destructive" });
    } else {
      setDailyEntries(data || []);
    }
    setDailyLoading(false);
  };

  const loadMonthly = async () => {
    setMonthlyLoading(true);
    const { data, error } = await supabase
      .from("monthly_revenue")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load monthly data", description: error.message, variant: "destructive" });
    } else {
      setMonthlyEntries(data || []);
    }
    setMonthlyLoading(false);
  };

  // --- Daily handlers ---
  const updateDaily = (field: keyof DailyEntry, value: string) => {
    if (field === "date") {
      setDailyDraft((d) => ({ ...d, date: value }));
    } else if (field !== "id") {
      const num = value === "" ? 0 : Number(value);
      if (value !== "" && isNaN(num)) return;
      setDailyDraft((d) => ({ ...d, [field]: num }));
    }
  };

  const addDaily = async () => {
    if (!dailyDraft.date) {
      toast({ title: "Date required", variant: "destructive" });
      return;
    }
    setDailySaving(true);
    const { date, mrr, members, about_page_traffic, discovery_rank, profile_activity, group_activity } = dailyDraft;
    const { error } = await supabase
      .from("daily_metrics")
      .upsert({ date, mrr, members, about_page_traffic, discovery_rank, profile_activity, group_activity }, { onConflict: "date" });

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Daily entry saved" });
      setDailyDraft({ ...EMPTY_DAILY, date: todayStr() });
      setShowDailyForm(false);
      await loadDaily();
    }
    setDailySaving(false);
  };

  const removeDaily = async (entry: DailyEntry) => {
    if (!entry.id) return;
    const { error } = await supabase.from("daily_metrics").delete().eq("id", entry.id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setDailyEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  // --- Monthly handlers ---
  const updateMonthly = (field: keyof MonthlyEntry, value: string) => {
    if (field === "month") {
      setMonthlyDraft((d) => ({ ...d, month: value }));
    } else if (field !== "id") {
      const num = value === "" ? 0 : Number(value);
      if (value !== "" && isNaN(num)) return;
      setMonthlyDraft((d) => ({ ...d, [field]: num }));
    }
  };

  const addMonthly = async () => {
    if (!monthlyDraft.month.trim()) {
      toast({ title: "Month required", description: "e.g. 'Apr 2026'", variant: "destructive" });
      return;
    }
    setMonthlySaving(true);
    const { month, new_revenue, revenue_churn } = monthlyDraft;
    const { error } = await supabase
      .from("monthly_revenue")
      .upsert({ month, new_revenue, revenue_churn }, { onConflict: "month" });

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Monthly entry saved" });
      setMonthlyDraft({ ...EMPTY_MONTHLY });
      setShowMonthlyForm(false);
      await loadMonthly();
    }
    setMonthlySaving(false);
  };

  const removeMonthly = async (entry: MonthlyEntry) => {
    if (!entry.id) return;
    const { error } = await supabase.from("monthly_revenue").delete().eq("id", entry.id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setMonthlyEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  // --- Acquisition handlers ---
  const loadAcquisitions = async () => {
    setAcqLoading(true);
    const { data, error } = await supabase
      .from("daily_acquisitions")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast({ title: "Failed to load acquisitions", description: error.message, variant: "destructive" });
    } else {
      setAcqEntries((data as unknown as AcquisitionEntry[]) || []);
    }
    setAcqLoading(false);
  };

  const updateAcq = (field: keyof AcquisitionEntry, value: string) => {
    if (field === "date") {
      setAcqDraft((d) => ({ ...d, date: value }));
    } else if (field !== "id") {
      const num = value === "" ? 0 : Number(value);
      if (value !== "" && isNaN(num)) return;
      setAcqDraft((d) => ({ ...d, [field]: num }));
    }
  };

  const addAcquisition = async () => {
    if (!acqDraft.date) {
      toast({ title: "Date required", variant: "destructive" });
      return;
    }
    setAcqSaving(true);
    const { id, ...payload } = acqDraft;
    const { error } = await supabase
      .from("daily_acquisitions")
      .upsert(payload as any, { onConflict: "date" });
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Acquisition entry saved" });
      setAcqDraft({ ...EMPTY_ACQ, date: todayStr() });
      setShowAcqForm(false);
      await loadAcquisitions();
    }
    setAcqSaving(false);
  };

  const removeAcq = async (entry: AcquisitionEntry) => {
    if (!entry.id) return;
    const { error } = await supabase.from("daily_acquisitions").delete().eq("id", entry.id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setAcqEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  // --- CSV handlers ---
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "Invalid CSV", description: "File must have headers and at least one row.", variant: "destructive" });
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));

      setCsvData({
        fileName: file.name,
        uploadedAt: new Date().toLocaleString(),
        rowCount: rows.length,
        previewHeaders: headers,
        previewRows: rows.slice(0, 10),
      });

      toast({ title: "CSV uploaded", description: `${file.name} — ${rows.length} rows loaded. This replaces any previous CSV.` });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Export ---
  const exportDaily = () => {
    if (dailyEntries.length === 0) return;
    const headers = ["Date", "MRR", "Members", "About Page Traffic", "Discovery Rank", "Profile Activity", "Group Activity"];
    const rows = dailyEntries.map((e) => [e.date, e.mrr, e.members, e.about_page_traffic, e.discovery_rank, e.profile_activity, e.group_activity].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "futureproof-daily-metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="daily" className="text-xs gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Daily Metrics
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Monthly Revenue
          </TabsTrigger>
          <TabsTrigger value="acquisition" className="text-xs gap-1.5">
            <Megaphone className="w-3.5 h-3.5" />
            Acquisition
          </TabsTrigger>
          <TabsTrigger value="csv" className="text-xs gap-1.5">
            <FileUp className="w-3.5 h-3.5" />
            CSV Upload
          </TabsTrigger>
        </TabsList>

        {/* ========== DAILY TAB ========== */}
        <TabsContent value="daily" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">Daily Metrics</CardTitle>
                <div className="flex gap-2">
                  {dailyEntries.length > 0 && (
                    <Button variant="outline" size="sm" onClick={exportDaily} className="text-xs">
                      <Download className="w-3.5 h-3.5 mr-1.5" />Export
                    </Button>
                  )}
                  {!showDailyForm && (
                    <Button size="sm" onClick={() => setShowDailyForm(true)} className="text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />Add Entry
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Inline form */}
              {showDailyForm && (
                <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
                      <Input
                        type="date"
                        value={dailyDraft.date}
                        onChange={(e) => updateDaily("date", e.target.value)}
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>
                    {DAILY_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{f.label}</label>
                        <Input
                          type="number"
                          value={dailyDraft[f.key] || ""}
                          onChange={(e) => updateDaily(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="h-8 text-xs bg-background font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addDaily} disabled={dailySaving} className="text-xs">
                      {dailySaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                      Save Entry
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowDailyForm(false); setDailyDraft({ ...EMPTY_DAILY, date: todayStr() }); }} className="text-xs">Cancel</Button>
                  </div>
                </div>
              )}

              {dailyLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading daily metrics...</span>
                </div>
              ) : dailyEntries.length === 0 && !showDailyForm ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No daily entries yet</p>
                  <p className="text-xs mt-1">Click "Add Entry" to start tracking your daily Skool metrics</p>
                </div>
              ) : dailyEntries.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="text-[10px] font-mono">Date</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">MRR</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Members</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">About Traffic</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Disc. Rank</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Profile Act.</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Group Act.</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyEntries.map((entry, i) => {
                        const prev = dailyEntries[i + 1];
                        return (
                          <TableRow key={entry.id || i} className="group">
                            <TableCell className="text-xs font-medium text-foreground font-mono">{entry.date}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-primary">{formatCurrency(entry.mrr)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.members}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.about_page_traffic}</TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              <span className={prev ? (entry.discovery_rank < prev.discovery_rank ? "text-emerald-400" : entry.discovery_rank > prev.discovery_rank ? "text-red-400" : "text-foreground") : "text-foreground"}>
                                {entry.discovery_rank}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.profile_activity}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.group_activity}</TableCell>
                            <TableCell>
                              <button onClick={() => removeDaily(entry)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily summary cards */}
          {dailyEntries.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Latest MRR", value: formatCurrency(dailyEntries[0]?.mrr || 0), color: "text-primary" },
                { label: "Latest Members", value: String(dailyEntries[0]?.members || 0), color: "text-foreground" },
                { label: "Avg About Traffic", value: (dailyEntries.reduce((s, e) => s + e.about_page_traffic, 0) / dailyEntries.length).toFixed(0), color: "text-foreground" },
                { label: "Best Rank", value: String(Math.min(...dailyEntries.map((e) => e.discovery_rank).filter(r => r > 0))), color: "text-primary" },
                { label: "Avg Profile Act.", value: (dailyEntries.reduce((s, e) => s + e.profile_activity, 0) / dailyEntries.length).toFixed(0), color: "text-foreground" },
                { label: "Avg Group Act.", value: (dailyEntries.reduce((s, e) => s + e.group_activity, 0) / dailyEntries.length).toFixed(0), color: "text-foreground" },
              ].map((stat) => (
                <Card key={stat.label} className="bg-card border-border">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className={`text-lg font-bold font-mono mt-1 ${stat.color}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== MONTHLY TAB ========== */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">Monthly Revenue Tracking</CardTitle>
                {!showMonthlyForm && (
                  <Button size="sm" onClick={() => setShowMonthlyForm(true)} className="text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Add Month
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showMonthlyForm && (
                <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Month</label>
                      <Input
                        value={monthlyDraft.month}
                        onChange={(e) => updateMonthly("month", e.target.value)}
                        placeholder="Apr 2026"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">New Revenue ($)</label>
                      <Input
                        type="number"
                        value={monthlyDraft.new_revenue || ""}
                        onChange={(e) => updateMonthly("new_revenue", e.target.value)}
                        placeholder="1249"
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Revenue Churn ($)</label>
                      <Input
                        type="number"
                        value={monthlyDraft.revenue_churn || ""}
                        onChange={(e) => updateMonthly("revenue_churn", e.target.value)}
                        placeholder="231"
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addMonthly} disabled={monthlySaving} className="text-xs">
                      {monthlySaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowMonthlyForm(false); setMonthlyDraft({ ...EMPTY_MONTHLY }); }} className="text-xs">Cancel</Button>
                  </div>
                </div>
              )}

              {monthlyLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading monthly data...</span>
                </div>
              ) : monthlyEntries.length === 0 && !showMonthlyForm ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No monthly entries yet</p>
                  <p className="text-xs mt-1">Track your new revenue and churn each month</p>
                </div>
              ) : monthlyEntries.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="text-[10px] font-mono">Month</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">New Revenue</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Revenue Churn</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Net</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyEntries.map((entry, i) => {
                        const net = entry.new_revenue - entry.revenue_churn;
                        return (
                          <TableRow key={entry.id || i} className="group">
                            <TableCell className="text-xs font-medium text-foreground">{entry.month}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-emerald-400">+{formatCurrency(entry.new_revenue)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-red-400">-{formatCurrency(entry.revenue_churn)}</TableCell>
                            <TableCell className={`text-xs text-right font-mono font-semibold ${net >= 0 ? "text-primary" : "text-red-400"}`}>
                              {net >= 0 ? "+" : ""}{formatCurrency(net)}
                            </TableCell>
                            <TableCell>
                              <button onClick={() => removeMonthly(entry)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== CSV TAB ========== */}
        <TabsContent value="csv" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground font-display">Skool Member CSV Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-foreground mb-1">Upload your Skool member export CSV</p>
                <p className="text-xs text-muted-foreground mb-4">Each upload replaces the previous CSV entirely</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                  <FileUp className="w-3.5 h-3.5 mr-1.5" />
                  {csvData ? "Replace CSV" : "Choose CSV File"}
                </Button>
              </div>

              {csvData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">{csvData.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{csvData.rowCount} members · Uploaded {csvData.uploadedAt}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCsvData(null)} className="text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Preview (first 10 rows)</p>
                    <div className="rounded-md border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/50">
                            {csvData.previewHeaders.map((h, i) => (
                              <TableHead key={i} className="text-[10px] font-mono whitespace-nowrap">{h}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.previewRows.map((row, i) => (
                            <TableRow key={i}>
                              {row.map((cell, j) => (
                                <TableCell key={j} className="text-[10px] font-mono whitespace-nowrap text-muted-foreground">{cell}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {csvData.rowCount > 10 && (
                      <p className="text-[10px] text-muted-foreground mt-1">...and {csvData.rowCount - 10} more rows</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
