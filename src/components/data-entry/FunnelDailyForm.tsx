import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/data";
import { tierPricesFor } from "@/lib/pricing";

const todayStr = () => new Date().toISOString().slice(0, 10);

type Funnel = "workshop" | "direct_skool";

type FunnelDailyRow = {
  id: string;
  date: string;
  funnel: string;
  workshop_id: string | null;
  ad_spend: number;
  registrations_paid: number;
  registrations_organic: number;
  workshop_revenue: number;
  intensive_revenue: number;
  futureproof_revenue: number;
  futureproof_t27: number;
  futureproof_t47: number;
  futureproof_t333: number;
  notes: string;
};

type Draft = Omit<FunnelDailyRow, "id">;

const EMPTY: Draft = {
  date: todayStr(),
  funnel: "workshop",
  workshop_id: null,
  ad_spend: 0,
  registrations_paid: 0,
  registrations_organic: 0,
  workshop_revenue: 0,
  intensive_revenue: 0,
  futureproof_revenue: 0,
  futureproof_t27: 0,
  futureproof_t47: 0,
  futureproof_t333: 0,
  notes: "",
};

export function FunnelDailyForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const { data: workshops = [] } = useQuery({
    queryKey: ["workshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("id, workshop_date, title")
        .order("workshop_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["funnel-daily-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnel_daily")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as FunnelDailyRow[];
    },
  });

  // Auto-default workshop selection to most recent when funnel = workshop
  useEffect(() => {
    if (draft.funnel === "workshop" && !draft.workshop_id && workshops.length > 0) {
      setDraft((d) => ({ ...d, workshop_id: workshops[0].id }));
    }
    if (draft.funnel === "direct_skool" && draft.workshop_id) {
      setDraft((d) => ({ ...d, workshop_id: null }));
    }
  }, [draft.funnel, draft.workshop_id, workshops]);

  // Auto-calc workshop revenue ($27 per reg) when paid/organic changes
  const computedWorkshopRev = useMemo(
    () => (draft.registrations_paid + draft.registrations_organic) * 27,
    [draft.registrations_paid, draft.registrations_organic],
  );
  // Auto-calc futureproof revenue from tier counts using date-aware pricing.
  const draftPrices = useMemo(() => tierPricesFor(draft.date), [draft.date]);
  const computedFutureproofRev = useMemo(
    () =>
      draft.futureproof_t27 * draftPrices.standard +
      draft.futureproof_t47 * draftPrices.premium +
      draft.futureproof_t333 * draftPrices.annual,
    [draft.futureproof_t27, draft.futureproof_t47, draft.futureproof_t333, draftPrices],
  );

  const [wsRevTouched, setWsRevTouched] = useState(false);
  const [fpRevTouched, setFpRevTouched] = useState(false);

  useEffect(() => {
    if (!wsRevTouched) setDraft((d) => ({ ...d, workshop_revenue: computedWorkshopRev }));
  }, [computedWorkshopRev, wsRevTouched]);

  useEffect(() => {
    if (!fpRevTouched) setDraft((d) => ({ ...d, futureproof_revenue: computedFutureproofRev }));
  }, [computedFutureproofRev, fpRevTouched]);

  const handleSave = async () => {
    if (draft.funnel === "workshop" && !draft.workshop_id) {
      toast({ title: "Workshop required", description: "Select a workshop for the workshop funnel.", variant: "destructive" });
      return;
    }
    setSaving(true);

    let existingId: string | null = editingId;
    if (!existingId) {
      let q = supabase.from("funnel_daily").select("id").eq("date", draft.date).eq("funnel", draft.funnel);
      q = draft.workshop_id ? q.eq("workshop_id", draft.workshop_id) : q.is("workshop_id", null);
      const { data: existing } = await q.maybeSingle();
      if (existing) existingId = existing.id;
    }

    const payload = { ...draft };
    const { error } = existingId
      ? await supabase.from("funnel_daily").update(payload).eq("id", existingId)
      : await supabase.from("funnel_daily").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: existingId ? "Daily entry updated" : "Daily entry saved" });
    setDraft({ ...EMPTY });
    setEditingId(null);
    setWsRevTouched(false);
    setFpRevTouched(false);
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["funnel-daily-list"] });
    qc.invalidateQueries({ queryKey: ["workshop-funnel"] });
  };

  const handleEdit = (r: FunnelDailyRow) => {
    const { id, ...rest } = r;
    setDraft({
      ...rest,
      ad_spend: Number(rest.ad_spend) || 0,
      workshop_revenue: Number(rest.workshop_revenue) || 0,
      intensive_revenue: Number(rest.intensive_revenue) || 0,
      futureproof_revenue: Number(rest.futureproof_revenue) || 0,
    });
    setEditingId(id);
    setWsRevTouched(true);
    setFpRevTouched(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("funnel_daily").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["funnel-daily-list"] });
    qc.invalidateQueries({ queryKey: ["workshop-funnel"] });
  };

  const wsLabel = (id: string | null) =>
    workshops.find((w) => w.id === id)?.workshop_date ?? "—";

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground font-display">Funnel Daily</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Add Daily Entry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Funnel</label>
                <Select value={draft.funnel} onValueChange={(v) => setDraft((d) => ({ ...d, funnel: v as Funnel }))}>
                  <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop" className="text-xs">Workshop</SelectItem>
                    <SelectItem value="direct_skool" className="text-xs">Direct to Skool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.funnel === "workshop" && (
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Workshop</label>
                  <Select value={draft.workshop_id ?? ""} onValueChange={(v) => setDraft((d) => ({ ...d, workshop_id: v }))}>
                    <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Select workshop" /></SelectTrigger>
                    <SelectContent>
                      {workshops.map((w) => (
                        <SelectItem key={w.id} value={w.id} className="text-xs">{w.workshop_date} — {w.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Ad Spend ($)</label>
                <Input type="number" value={draft.ad_spend || ""} onChange={(e) => setDraft((d) => ({ ...d, ad_spend: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Regs (Paid/Meta)</label>
                <Input type="number" value={draft.registrations_paid || ""} onChange={(e) => setDraft((d) => ({ ...d, registrations_paid: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Regs (Organic)</label>
                <Input type="number" value={draft.registrations_organic || ""} onChange={(e) => setDraft((d) => ({ ...d, registrations_organic: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Workshop Revenue ($)</label>
                <Input type="number" value={draft.workshop_revenue || ""} onChange={(e) => { setWsRevTouched(true); setDraft((d) => ({ ...d, workshop_revenue: Number(e.target.value) || 0 })); }} className="h-8 text-xs bg-background font-mono" />
                {!wsRevTouched && <p className="text-[9px] text-muted-foreground mt-1">Auto: $27 × {draft.registrations_paid + draft.registrations_organic}</p>}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Futureproof Downsell Signups</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Standard (${draftPrices.standard}/mo)</label>
                  <Input type="number" value={draft.futureproof_t27 || ""} onChange={(e) => setDraft((d) => ({ ...d, futureproof_t27: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Premium (${draftPrices.premium}/mo)</label>
                  <Input type="number" value={draft.futureproof_t47 || ""} onChange={(e) => setDraft((d) => ({ ...d, futureproof_t47: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Annual (${draftPrices.annual}/yr)</label>
                  <Input type="number" value={draft.futureproof_t333 || ""} onChange={(e) => setDraft((d) => ({ ...d, futureproof_t333: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">FP Revenue ($)</label>
                  <Input type="number" value={draft.futureproof_revenue || ""} onChange={(e) => { setFpRevTouched(true); setDraft((d) => ({ ...d, futureproof_revenue: Number(e.target.value) || 0 })); }} className="h-8 text-xs bg-background font-mono" />
                  {!fpRevTouched && <p className="text-[9px] text-muted-foreground mt-1">Auto from tier counts</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Intensive Revenue ($)</label>
                <Input type="number" value={draft.intensive_revenue || ""} onChange={(e) => setDraft((d) => ({ ...d, intensive_revenue: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
                <Textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="text-xs bg-background min-h-[40px]" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
                {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}{editingId ? "Update Entry" : "Save Daily Entry"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setDraft({ ...EMPTY }); setEditingId(null); setWsRevTouched(false); setFpRevTouched(false); }} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading…</span></div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No daily entries yet.</p>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-[10px] font-mono">Date</TableHead>
                  <TableHead className="text-[10px] font-mono">Funnel</TableHead>
                  <TableHead className="text-[10px] font-mono">Workshop</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">Ad $</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">Regs (P/O)</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">WS Rev</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">Intensive</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">FP Rev</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">FP (Std/Prem/Ann)</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell className="text-xs font-mono">{r.date}</TableCell>
                    <TableCell className="text-xs">{r.funnel}</TableCell>
                    <TableCell className="text-xs font-mono">{r.workshop_id ? wsLabel(r.workshop_id) : "—"}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrency(Number(r.ad_spend))}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{r.registrations_paid}/{r.registrations_organic}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrency(Number(r.workshop_revenue))}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrency(Number(r.intensive_revenue))}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrency(Number(r.futureproof_revenue))}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{r.futureproof_t27}/{r.futureproof_t47}/{r.futureproof_t333}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(r)} className="text-muted-foreground hover:text-primary" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
