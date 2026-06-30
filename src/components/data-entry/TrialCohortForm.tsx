import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/data";

const todayStr = () => new Date().toISOString().slice(0, 10);
const LTV = 266; // ARPU $38 × ~7 months

type Row = {
  id: string;
  trial_start_date: string;
  funnel: string;
  trial_starts: number;
  ad_spend_attributed: number;
  day7_paid: number | null;
  day30_still_paid: number | null;
  first_payment_revenue: number;
  notes: string;
};

type Draft = Omit<Row, "id">;

const EMPTY: Draft = {
  trial_start_date: todayStr(),
  funnel: "skool_trial_ads",
  trial_starts: 0,
  ad_spend_attributed: 0,
  day7_paid: null,
  day30_still_paid: null,
  first_payment_revenue: 0,
  notes: "",
};

const isMature = (dateStr: string) => {
  const start = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() >= start.getTime() + 7 * 24 * 60 * 60 * 1000;
};

export function TrialCohortForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["trial-cohorts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_cohorts")
        .select("*")
        .order("trial_start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const handleSave = async () => {
    if (!draft.trial_start_date || !draft.funnel.trim()) {
      toast({ title: "Date and funnel required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...draft };
    const { error } = editingId
      ? await supabase.from("trial_cohorts").update(payload).eq("id", editingId)
      : await supabase.from("trial_cohorts").upsert(payload, { onConflict: "trial_start_date,funnel" });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Cohort updated" : "Cohort saved" });
    setDraft({ ...EMPTY });
    setEditingId(null);
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["trial-cohorts-list"] });
    qc.invalidateQueries({ queryKey: ["trial-health"] });
  };

  const handleEdit = (r: Row) => {
    const { id, ...rest } = r;
    setDraft({
      ...rest,
      ad_spend_attributed: Number(rest.ad_spend_attributed) || 0,
      first_payment_revenue: Number(rest.first_payment_revenue) || 0,
    });
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trial_cohorts").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["trial-cohorts-list"] });
    qc.invalidateQueries({ queryKey: ["trial-health"] });
  };

  const numOrEmpty = (v: number | null) => (v == null ? "" : v);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground font-display">Trial Cohorts</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Add Cohort
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Trial Start Date</label>
                <Input type="date" value={draft.trial_start_date} onChange={(e) => setDraft((d) => ({ ...d, trial_start_date: e.target.value }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Funnel</label>
                <Input value={draft.funnel} onChange={(e) => setDraft((d) => ({ ...d, funnel: e.target.value }))} placeholder="skool_trial_ads" className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Trial Starts</label>
                <Input type="number" value={draft.trial_starts || ""} onChange={(e) => setDraft((d) => ({ ...d, trial_starts: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Ad Spend ($)</label>
                <Input type="number" value={draft.ad_spend_attributed || ""} onChange={(e) => setDraft((d) => ({ ...d, ad_spend_attributed: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Fill in once mature</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Day 7 Paid</label>
                  <Input type="number" value={numOrEmpty(draft.day7_paid)} onChange={(e) => setDraft((d) => ({ ...d, day7_paid: e.target.value === "" ? null : Number(e.target.value) }))} className="h-8 text-xs bg-background font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Day 30 Still Paid</label>
                  <Input type="number" value={numOrEmpty(draft.day30_still_paid)} onChange={(e) => setDraft((d) => ({ ...d, day30_still_paid: e.target.value === "" ? null : Number(e.target.value) }))} className="h-8 text-xs bg-background font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">First Payment Revenue ($)</label>
                  <Input type="number" value={draft.first_payment_revenue || ""} onChange={(e) => setDraft((d) => ({ ...d, first_payment_revenue: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="text-xs bg-background min-h-[40px]" />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
                {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}{editingId ? "Update Cohort" : "Save Cohort"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setDraft({ ...EMPTY }); setEditingId(null); }} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading…</span></div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No trial cohorts yet.</p>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-[10px] font-mono">Start</TableHead>
                  <TableHead className="text-[10px] font-mono">Funnel</TableHead>
                  <TableHead className="text-[10px] font-mono">Maturity</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">Starts</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">Ad $</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">D7 Paid</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">D30 Paid</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">T→P</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">CAC</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">LTV ROAS</TableHead>
                  <TableHead className="text-[10px] font-mono text-right">1st Pmt $</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const mature = isMature(r.trial_start_date);
                  const d7 = r.day7_paid ?? 0;
                  const ttp = r.trial_starts > 0 && r.day7_paid != null ? (d7 / r.trial_starts) * 100 : null;
                  const cac = d7 > 0 ? Number(r.ad_spend_attributed) / d7 : null;
                  const roas = Number(r.ad_spend_attributed) > 0 && r.day7_paid != null ? (d7 * LTV) / Number(r.ad_spend_attributed) : null;
                  return (
                    <TableRow key={r.id} className={`group ${!mature ? "opacity-60" : ""}`}>
                      <TableCell className="text-xs font-mono">{r.trial_start_date}</TableCell>
                      <TableCell className="text-xs font-mono">{r.funnel}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${mature ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {mature ? "Mature" : "Not mature"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">{r.trial_starts}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{formatCurrency(Number(r.ad_spend_attributed))}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{r.day7_paid ?? "—"}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{r.day30_still_paid ?? "—"}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{ttp != null ? `${ttp.toFixed(1)}%` : "—"}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{cac != null ? formatCurrency(cac) : "—"}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{roas != null ? `${roas.toFixed(2)}×` : "—"}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{formatCurrency(Number(r.first_payment_revenue))}</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
