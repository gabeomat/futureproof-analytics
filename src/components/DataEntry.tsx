import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Upload, CalendarDays, TrendingUp, FileUp, Loader2, Megaphone, UserMinus, NotebookPen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  revenue: number;
  ad_conv_27: number;
  ad_conv_47: number;
  ad_conv_333: number;
  organic_27: number;
  organic_47: number;
  organic_333: number;
  organic_source: string;
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
const EMPTY_ACQ: AcquisitionEntry = { date: todayStr(), ad_spend: 0, revenue: 0, ad_conv_27: 0, ad_conv_47: 0, ad_conv_333: 0, organic_27: 0, organic_47: 0, organic_333: 0, organic_source: "" };

interface ChurnEntry {
  id?: string;
  date: string;
  price_point: number;
  notes: string;
  first_name: string;
  last_name: string;
  email: string;
  joined_date: string;
  tier: string;
  ltv: number;
}

const EMPTY_CHURN: ChurnEntry = { date: todayStr(), price_point: 0, notes: "", first_name: "", last_name: "", email: "", joined_date: "", tier: "", ltv: 0 };

interface CEONotesEntry {
  id?: string;
  date: string;
  biggest_win: string;
  biggest_bottleneck: string;
  todays_focus: string;
  notes: string;
}

const EMPTY_CEO: CEONotesEntry = { date: todayStr(), biggest_win: "", biggest_bottleneck: "", todays_focus: "", notes: "" };

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
  const [acqCsvImporting, setAcqCsvImporting] = useState(false);
  const acqCsvInputRef = useRef<HTMLInputElement>(null);

  // Churn state
  const [churnEntries, setChurnEntries] = useState<ChurnEntry[]>([]);
  const [churnDraft, setChurnDraft] = useState<ChurnEntry>({ ...EMPTY_CHURN });
  const [showChurnForm, setShowChurnForm] = useState(false);
  const [churnLoading, setChurnLoading] = useState(true);
  const [churnSaving, setChurnSaving] = useState(false);
  const [churnCsvImporting, setChurnCsvImporting] = useState(false);
  const churnCsvInputRef = useRef<HTMLInputElement>(null);

  // CEO Notes state
  const [ceoEntries, setCeoEntries] = useState<CEONotesEntry[]>([]);
  const [ceoDraft, setCeoDraft] = useState<CEONotesEntry>({ ...EMPTY_CEO });
  const [showCeoForm, setShowCeoForm] = useState(false);
  const [ceoLoading, setCeoLoading] = useState(true);
  const [ceoSaving, setCeoSaving] = useState(false);

  // CSV state
  const [csvData, setCsvData] = useState<CSVUpload | null>(null);

  // --- Load data on mount ---
  useEffect(() => {
    loadDaily();
    loadMonthly();
    loadAcquisitions();
    loadChurnEvents();
    loadCeoNotes();
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
    if (field === "date" || field === "organic_source") {
      setAcqDraft((d) => ({ ...d, [field]: value }));
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

  // --- Acquisition CSV Import ---
  const handleAcqCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAcqCsvImporting(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          toast({ title: "Invalid CSV", description: "File must have headers and at least one data row.", variant: "destructive" });
          setAcqCsvImporting(false);
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

        const dateIdx = headers.findIndex((h) => h === "date");
        const spendIdx = headers.findIndex((h) => h === "ad_spend");
        const revenueIdx = headers.findIndex((h) => h === "revenue");
        const ac27Idx = headers.findIndex((h) => h === "t27");
        const ac47Idx = headers.findIndex((h) => h === "t47");
        const ac333Idx = headers.findIndex((h) => h === "t333");

        if (dateIdx === -1) {
          toast({ title: "Missing 'date' column", description: "CSV must have a 'date' column.", variant: "destructive" });
          setAcqCsvImporting(false);
          return;
        }

        const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
        const records = rows.filter((r) => r[dateIdx]).map((r) => ({
          date: r[dateIdx],
          ad_spend: spendIdx >= 0 ? Number(r[spendIdx]) || 0 : 0,
          revenue: revenueIdx >= 0 ? Number(r[revenueIdx]) || 0 : 0,
          ad_conv_27: ac27Idx >= 0 ? Number(r[ac27Idx]) || 0 : 0,
          ad_conv_47: ac47Idx >= 0 ? Number(r[ac47Idx]) || 0 : 0,
          ad_conv_333: ac333Idx >= 0 ? Number(r[ac333Idx]) || 0 : 0,
          organic_27: 0,
          organic_47: 0,
          organic_333: 0,
          organic_source: "",
        }));

        if (records.length === 0) {
          toast({ title: "No valid rows", variant: "destructive" });
          setAcqCsvImporting(false);
          return;
        }

        // Batch upsert in chunks of 50
        for (let i = 0; i < records.length; i += 50) {
          const chunk = records.slice(i, i + 50);
          const { error } = await supabase
            .from("daily_acquisitions")
            .upsert(chunk as any, { onConflict: "date" });
          if (error) {
            toast({ title: "Import failed", description: error.message, variant: "destructive" });
            setAcqCsvImporting(false);
            return;
          }
        }

        toast({ title: "CSV imported", description: `${records.length} acquisition rows imported successfully.` });
        await loadAcquisitions();
      } catch (err) {
        toast({ title: "Import error", description: String(err), variant: "destructive" });
      }
      setAcqCsvImporting(false);
    };
    reader.readAsText(file);
    if (acqCsvInputRef.current) acqCsvInputRef.current.value = "";
  };

  // --- Churn handlers ---
  const loadChurnEvents = async () => {
    setChurnLoading(true);
    const { data, error } = await supabase
      .from("churn_events")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast({ title: "Failed to load churn events", description: error.message, variant: "destructive" });
    } else {
      setChurnEntries((data as unknown as ChurnEntry[]) || []);
    }
    setChurnLoading(false);
  };

  const addChurnEvent = async () => {
    if (!churnDraft.date || !churnDraft.price_point) {
      toast({ title: "Date and price point required", variant: "destructive" });
      return;
    }
    setChurnSaving(true);
    const { id, ...payload } = churnDraft;
    const { error } = await supabase.from("churn_events").insert(payload as any);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Churn event logged" });
      setChurnDraft({ ...EMPTY_CHURN, date: todayStr() });
      setShowChurnForm(false);
      await loadChurnEvents();
    }
    setChurnSaving(false);
  };

  const removeChurn = async (entry: ChurnEntry) => {
    if (!entry.id) return;
    const { error } = await supabase.from("churn_events").delete().eq("id", entry.id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setChurnEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  // --- Churn CSV Import ---
  const handleChurnCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChurnCsvImporting(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          toast({ title: "Invalid CSV", description: "File must have headers and at least one data row.", variant: "destructive" });
          setChurnCsvImporting(false);
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

        const firstNameIdx = headers.findIndex((h) => h === "firstname");
        const lastNameIdx = headers.findIndex((h) => h === "lastname");
        const emailIdx = headers.findIndex((h) => h === "email");
        const joinedDateIdx = headers.findIndex((h) => h === "joineddate");
        const priceIdx = headers.findIndex((h) => h === "price");
        const tierIdx = headers.findIndex((h) => h === "tier");
        const ltvIdx = headers.findIndex((h) => h === "ltv");

        const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
        const records = rows.filter((r) => r.length > 1).map((r) => {
          const priceStr = priceIdx >= 0 ? r[priceIdx].replace(/[^0-9.]/g, "") : "0";
          const ltvStr = ltvIdx >= 0 ? r[ltvIdx].replace(/[^0-9.]/g, "") : "0";
          const joinedRaw = joinedDateIdx >= 0 ? r[joinedDateIdx] : "";
          return {
            date: todayStr(),
            first_name: firstNameIdx >= 0 ? r[firstNameIdx] : "",
            last_name: lastNameIdx >= 0 ? r[lastNameIdx] : "",
            email: emailIdx >= 0 ? r[emailIdx] : "",
            joined_date: joinedRaw || null,
            price_point: Number(priceStr) || 0,
            tier: tierIdx >= 0 ? r[tierIdx] : "",
            ltv: Number(ltvStr) || 0,
            notes: "",
          };
        });

        if (records.length === 0) {
          toast({ title: "No valid rows", variant: "destructive" });
          setChurnCsvImporting(false);
          return;
        }

        // Clear existing and insert new
        await supabase.from("churn_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        for (let i = 0; i < records.length; i += 50) {
          const chunk = records.slice(i, i + 50);
          const { error } = await supabase.from("churn_events").insert(chunk as any);
          if (error) {
            toast({ title: "Import failed", description: error.message, variant: "destructive" });
            setChurnCsvImporting(false);
            return;
          }
        }

        toast({ title: "Churn CSV imported", description: `${records.length} churned members imported.` });
        await loadChurnEvents();
      } catch (err) {
        toast({ title: "Import error", description: String(err), variant: "destructive" });
      }
      setChurnCsvImporting(false);
    };
    reader.readAsText(file);
    if (churnCsvInputRef.current) churnCsvInputRef.current.value = "";
  };

  // --- CEO Notes handlers ---
  const loadCeoNotes = async () => {
    setCeoLoading(true);
    const { data, error } = await supabase
      .from("ceo_notes")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast({ title: "Failed to load CEO notes", description: error.message, variant: "destructive" });
    } else {
      setCeoEntries((data as unknown as CEONotesEntry[]) || []);
    }
    setCeoLoading(false);
  };

  const addCeoNote = async () => {
    if (!ceoDraft.date) {
      toast({ title: "Date required", variant: "destructive" });
      return;
    }
    if (!ceoDraft.biggest_win.trim() && !ceoDraft.biggest_bottleneck.trim() && !ceoDraft.todays_focus.trim()) {
      toast({ title: "Fill in at least one field", variant: "destructive" });
      return;
    }
    setCeoSaving(true);
    const { id, ...payload } = ceoDraft;
    const { error } = await supabase
      .from("ceo_notes")
      .upsert(payload as any, { onConflict: "date" });
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "CEO note saved" });
      setCeoDraft({ ...EMPTY_CEO, date: todayStr() });
      setShowCeoForm(false);
      await loadCeoNotes();
    }
    setCeoSaving(false);
  };

  const removeCeoNote = async (entry: CEONotesEntry) => {
    if (!entry.id) return;
    const { error } = await supabase.from("ceo_notes").delete().eq("id", entry.id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setCeoEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  // --- CSV handlers ---
  const [csvImporting, setCsvImporting] = useState(false);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          toast({ title: "Invalid CSV", description: "File must have headers and at least one row.", variant: "destructive" });
          setCsvImporting(false);
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const headersLower = headers.map((h) => h.toLowerCase());
        const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));

        // Show preview
        setCsvData({
          fileName: file.name,
          uploadedAt: new Date().toLocaleString(),
          rowCount: rows.length,
          previewHeaders: headers,
          previewRows: rows.slice(0, 10),
        });

        // Map CSV columns to skool_members table
        const findCol = (names: string[]) => headersLower.findIndex((h) => names.includes(h));
        const firstNameIdx = findCol(["firstname", "first_name", "first name"]);
        const lastNameIdx = findCol(["lastname", "last_name", "last name"]);
        const emailIdx = findCol(["email"]);
        const joinedIdx = findCol(["joineddate", "joined_date", "joined date", "joined"]);
        const priceIdx = findCol(["price", "price_point"]);
        const tierIdx = findCol(["tier", "level"]);
        const ltvIdx = findCol(["ltv", "lifetime value"]);
        const statusIdx = findCol(["status"]);
        const lastActiveIdx = findCol(["lastactive", "last_active", "last active"]);

        const records = rows.filter((r) => r.length > 1).map((r) => ({
          first_name: firstNameIdx >= 0 ? r[firstNameIdx] || null : null,
          last_name: lastNameIdx >= 0 ? r[lastNameIdx] || null : null,
          email: emailIdx >= 0 ? r[emailIdx] || null : null,
          joined_date: joinedIdx >= 0 ? r[joinedIdx] || null : null,
          price: priceIdx >= 0 ? r[priceIdx] || null : null,
          tier: tierIdx >= 0 ? r[tierIdx] || null : null,
          ltv: ltvIdx >= 0 ? r[ltvIdx] || null : null,
          status: statusIdx >= 0 ? r[statusIdx] || null : null,
          last_active: lastActiveIdx >= 0 ? r[lastActiveIdx] || null : null,
        }));

        if (records.length === 0) {
          toast({ title: "No valid rows found", variant: "destructive" });
          setCsvImporting(false);
          return;
        }

        // Clear existing members and replace with new CSV data
        await (supabase.from as any)("skool_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        for (let i = 0; i < records.length; i += 50) {
          const chunk = records.slice(i, i + 50);
          const { error } = await (supabase.from as any)("skool_members").insert(chunk as any);
          if (error) {
            toast({ title: "Import failed", description: error.message, variant: "destructive" });
            setCsvImporting(false);
            return;
          }
        }

        toast({ title: "CSV uploaded and saved", description: `${file.name} — ${records.length} members saved to database. AI Insights now has access to this data.` });
      } catch (err) {
        toast({ title: "Import error", description: String(err), variant: "destructive" });
      }
      setCsvImporting(false);
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
          <TabsTrigger value="ceo" className="text-xs gap-1.5">
            <NotebookPen className="w-3.5 h-3.5" />
            CEO Notes
          </TabsTrigger>
          <TabsTrigger value="churn" className="text-xs gap-1.5">
            <UserMinus className="w-3.5 h-3.5" />
            Churn Log
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

        {/* ========== ACQUISITION TAB ========== */}
        <TabsContent value="acquisition" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">Daily Acquisition Tracking</CardTitle>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleAcqCSVImport}
                    className="hidden"
                    ref={acqCsvInputRef}
                  />
                  <Button variant="outline" size="sm" onClick={() => acqCsvInputRef.current?.click()} disabled={acqCsvImporting} className="text-xs">
                    {acqCsvImporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                    Import CSV
                  </Button>
                  {!showAcqForm && (
                    <Button size="sm" onClick={() => setShowAcqForm(true)} className="text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />Add Entry
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showAcqForm && (
                <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
                      <Input type="date" value={acqDraft.date} onChange={(e) => updateAcq("date", e.target.value)} className="h-8 text-xs bg-background font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Ad Spend ($)</label>
                      <Input type="number" value={acqDraft.ad_spend || ""} onChange={(e) => updateAcq("ad_spend", e.target.value)} placeholder="50" className="h-8 text-xs bg-background font-mono" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Ad Conversions</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">$27/mo</label>
                        <Input type="number" min="0" value={acqDraft.ad_conv_27 || ""} onChange={(e) => updateAcq("ad_conv_27", e.target.value)} placeholder="0" className="h-8 text-xs bg-background font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">$47/mo</label>
                        <Input type="number" min="0" value={acqDraft.ad_conv_47 || ""} onChange={(e) => updateAcq("ad_conv_47", e.target.value)} placeholder="0" className="h-8 text-xs bg-background font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">$333/yr</label>
                        <Input type="number" min="0" value={acqDraft.ad_conv_333 || ""} onChange={(e) => updateAcq("ad_conv_333", e.target.value)} placeholder="0" className="h-8 text-xs bg-background font-mono" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Revenue</p>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Total Revenue ($)</label>
                      <Input type="number" min="0" value={acqDraft.revenue || ""} onChange={(e) => updateAcq("revenue", e.target.value)} placeholder="0" className="h-8 text-xs bg-background font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addAcquisition} disabled={acqSaving} className="text-xs">
                      {acqSaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}Save Entry
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowAcqForm(false); setAcqDraft({ ...EMPTY_ACQ, date: todayStr() }); }} className="text-xs">Cancel</Button>
                  </div>
                </div>
              )}

              {acqLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading acquisition data...</span>
                </div>
              ) : acqEntries.length === 0 && !showAcqForm ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No acquisition entries yet</p>
                  <p className="text-xs mt-1">Track your daily ad spend and conversions by price tier</p>
                </div>
              ) : acqEntries.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="text-[10px] font-mono">Date</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Ad Spend</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Revenue</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Ad $27</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Ad $47</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">Ad $333</TableHead>
                        <TableHead className="text-[10px] font-mono text-right">CPA</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acqEntries.map((entry, i) => {
                        const totalAdConv = entry.ad_conv_27 + entry.ad_conv_47 + entry.ad_conv_333;
                        const cpa = totalAdConv > 0 ? entry.ad_spend / totalAdConv : 0;
                        return (
                          <TableRow key={entry.id || i} className="group">
                            <TableCell className="text-xs font-medium text-foreground font-mono">{entry.date}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{formatCurrency(entry.ad_spend)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{formatCurrency(entry.revenue)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.ad_conv_27}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.ad_conv_47}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-foreground">{entry.ad_conv_333}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-primary font-semibold">{totalAdConv > 0 ? formatCurrency(cpa) : "—"}</TableCell>
                            <TableCell>
                              <button onClick={() => removeAcq(entry)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
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

          {/* Acquisition summary cards */}
          {acqEntries.length > 0 && (() => {
            const totalSpend = acqEntries.reduce((s, e) => s + Number(e.ad_spend), 0);
            const totalRevenue = acqEntries.reduce((s, e) => s + Number(e.revenue), 0);
            const totalAdConv = acqEntries.reduce((s, e) => s + e.ad_conv_27 + e.ad_conv_47 + e.ad_conv_333, 0);
            const avgCpa = totalAdConv > 0 ? totalSpend / totalAdConv : 0;
            const adMrrAdded = acqEntries.reduce((s, e) => s + e.ad_conv_27 * 27 + e.ad_conv_47 * 47 + e.ad_conv_333 * (333 / 12), 0);
            const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Total Ad Spend", value: formatCurrency(totalSpend), color: "text-foreground" },
                  { label: "Total Revenue", value: formatCurrency(totalRevenue), color: "text-primary" },
                  { label: "Ad Conversions", value: String(totalAdConv), color: "text-primary" },
                  { label: "Avg CPA", value: avgCpa > 0 ? formatCurrency(avgCpa) : "—", color: "text-foreground" },
                  { label: "ROAS (Rev/Spend)", value: totalSpend > 0 ? `${roas.toFixed(2)}x` : "—", color: roas >= 1 ? "text-primary" : "text-destructive" },
                ].map((stat) => (
                  <Card key={stat.label} className="bg-card border-border">
                    <CardContent className="p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className={`text-lg font-bold font-mono mt-1 ${stat.color}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
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
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={csvImporting} className="text-xs">
                  {csvImporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5 mr-1.5" />}
                  {csvImporting ? "Saving to database..." : csvData ? "Replace CSV" : "Choose CSV File"}
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

        {/* ========== CEO NOTES TAB ========== */}
        <TabsContent value="ceo" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">CEO Daily Notes</CardTitle>
                {!showCeoForm && (
                  <Button size="sm" onClick={() => setShowCeoForm(true)} className="text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Add Entry
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showCeoForm && (
                <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
                      <Input
                        type="date"
                        value={ceoDraft.date}
                        onChange={(e) => setCeoDraft((d) => ({ ...d, date: e.target.value }))}
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Biggest Win</label>
                    <Input
                      value={ceoDraft.biggest_win}
                      onChange={(e) => setCeoDraft((d) => ({ ...d, biggest_win: e.target.value }))}
                      placeholder="What went well today?"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Biggest Bottleneck</label>
                    <Input
                      value={ceoDraft.biggest_bottleneck}
                      onChange={(e) => setCeoDraft((d) => ({ ...d, biggest_bottleneck: e.target.value }))}
                      placeholder="What's slowing you down?"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Today's Focus</label>
                    <Input
                      value={ceoDraft.todays_focus}
                      onChange={(e) => setCeoDraft((d) => ({ ...d, todays_focus: e.target.value }))}
                      placeholder="What's the #1 priority?"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Notes (optional)</label>
                    <Textarea
                      value={ceoDraft.notes}
                      onChange={(e) => setCeoDraft((d) => ({ ...d, notes: e.target.value }))}
                      placeholder="Any extra context for AI..."
                      className="text-xs bg-background min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addCeoNote} disabled={ceoSaving} className="text-xs">
                      {ceoSaving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                      Save Entry
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowCeoForm(false); setCeoDraft({ ...EMPTY_CEO, date: todayStr() }); }} className="text-xs">Cancel</Button>
                  </div>
                </div>
              )}

              {ceoLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Loading CEO notes...</span>
                </div>
              ) : ceoEntries.length === 0 && !showCeoForm ? (
                <div className="text-center py-12 text-muted-foreground">
                  <NotebookPen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No CEO notes yet</p>
                  <p className="text-xs mt-1">Track your daily wins, bottlenecks, and focus areas</p>
                </div>
              ) : ceoEntries.length > 0 && (
                <div className="space-y-3">
                  {ceoEntries.map((entry) => (
                    <div key={entry.id} className="p-3 rounded-lg border border-border bg-secondary/30 group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-mono font-medium text-foreground">{entry.date}</p>
                        <button onClick={() => removeCeoNote(entry)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {entry.biggest_win && (
                          <p className="text-xs"><span className="text-muted-foreground font-medium">Win:</span> <span className="text-foreground">{entry.biggest_win}</span></p>
                        )}
                        {entry.biggest_bottleneck && (
                          <p className="text-xs"><span className="text-muted-foreground font-medium">Bottleneck:</span> <span className="text-foreground">{entry.biggest_bottleneck}</span></p>
                        )}
                        {entry.todays_focus && (
                          <p className="text-xs"><span className="text-muted-foreground font-medium">Focus:</span> <span className="text-foreground">{entry.todays_focus}</span></p>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Churned Members</CardTitle>
                <div className="flex gap-2">
                  <input ref={churnCsvInputRef} type="file" accept=".csv" onChange={handleChurnCSVImport} className="hidden" />
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => churnCsvInputRef.current?.click()} disabled={churnCsvImporting}>
                    {churnCsvImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Import CSV
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setShowChurnForm(!showChurnForm)}>
                    <Plus className="w-3.5 h-3.5" />
                    Log Churn
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Import your churned members CSV or log individual events.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {showChurnForm && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">First Name</label>
                    <Input value={churnDraft.first_name} onChange={(e) => setChurnDraft((d) => ({ ...d, first_name: e.target.value }))} className="mt-1 h-8 text-xs bg-background" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Name</label>
                    <Input value={churnDraft.last_name} onChange={(e) => setChurnDraft((d) => ({ ...d, last_name: e.target.value }))} className="mt-1 h-8 text-xs bg-background" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</label>
                    <Input value={churnDraft.email} onChange={(e) => setChurnDraft((d) => ({ ...d, email: e.target.value }))} className="mt-1 h-8 text-xs bg-background" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price ($)</label>
                    <Input type="number" value={churnDraft.price_point || ""} onChange={(e) => setChurnDraft((d) => ({ ...d, price_point: Number(e.target.value) || 0 }))} className="mt-1 h-8 text-xs bg-background" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tier</label>
                    <Input value={churnDraft.tier} onChange={(e) => setChurnDraft((d) => ({ ...d, tier: e.target.value }))} placeholder="standard / premium" className="mt-1 h-8 text-xs bg-background" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">LTV ($)</label>
                    <Input type="number" value={churnDraft.ltv || ""} onChange={(e) => setChurnDraft((d) => ({ ...d, ltv: Number(e.target.value) || 0 }))} className="mt-1 h-8 text-xs bg-background" />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <Button size="sm" className="text-xs gap-1.5" onClick={addChurnEvent} disabled={churnSaving}>
                      {churnSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {churnLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : churnEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No churned members yet. Import a CSV or click "Log Churn" to start.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Churned</p>
                      <p className="text-lg font-bold text-foreground">{churnEntries.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">MRR Lost</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(churnEntries.reduce((sum, e) => sum + e.price_point, 0))}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total LTV Lost</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(churnEntries.reduce((sum, e) => sum + e.ltv, 0))}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="text-[10px] font-semibold">Name</TableHead>
                          <TableHead className="text-[10px] font-semibold">Email</TableHead>
                          <TableHead className="text-[10px] font-semibold">Joined</TableHead>
                          <TableHead className="text-[10px] font-semibold text-right">Price</TableHead>
                          <TableHead className="text-[10px] font-semibold">Tier</TableHead>
                          <TableHead className="text-[10px] font-semibold text-right">LTV</TableHead>
                          <TableHead className="w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {churnEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-xs font-mono">{entry.first_name} {entry.last_name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{entry.email || "—"}</TableCell>
                            <TableCell className="text-xs font-mono">{entry.joined_date ? new Date(entry.joined_date).toLocaleDateString() : "—"}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{formatCurrency(entry.price_point)}</TableCell>
                            <TableCell className="text-xs capitalize">{entry.tier || "—"}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{formatCurrency(entry.ltv)}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeChurn(entry)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
