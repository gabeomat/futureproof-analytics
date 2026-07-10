import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const todayStr = () => new Date().toISOString().slice(0, 10);

type Workshop = {
  id: string;
  workshop_date: string;
  title: string;
  registration_window_start: string;
  registration_window_end: string;
  intensive_price: number;
  intensive_waitlist_mode: boolean;
  
  meta_attributed_registrations: number;
  attended: number | null;
  intensive_applications: number;
  intensive_declined: number;
  intensive_closes: number;
  notes: string;
};

const NEW_WORKSHOP = {
  workshop_date: todayStr(),
  title: "Create Your Living Workspace",
  registration_window_start: todayStr(),
  registration_window_end: todayStr(),
  intensive_price: 1997,
  intensive_waitlist_mode: true,
};

export function WorkshopForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [draft, setDraft] = useState<Partial<Workshop>>({});
  const [newWorkshop, setNewWorkshop] = useState({ ...NEW_WORKSHOP });
  const [saving, setSaving] = useState(false);

  const { data: workshops = [], isLoading } = useQuery({
    queryKey: ["workshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .order("workshop_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Workshop[];
    },
  });

  useEffect(() => {
    if (!selectedId && workshops.length > 0 && !creatingNew) {
      setSelectedId(workshops[0].id);
    }
  }, [workshops, selectedId, creatingNew]);

  useEffect(() => {
    const w = workshops.find((x) => x.id === selectedId);
    if (w) setDraft(w);
  }, [selectedId, workshops]);

  const handleCreate = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("workshops")
      .insert(newWorkshop)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Failed to create workshop", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Workshop created" });
    qc.invalidateQueries({ queryKey: ["workshops"] });
    setCreatingNew(false);
    setSelectedId(data.id);
    setNewWorkshop({ ...NEW_WORKSHOP });
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const payload = {
      attended: draft.attended,
      
      meta_attributed_registrations: draft.meta_attributed_registrations ?? 0,
      intensive_applications: draft.intensive_applications ?? 0,
      intensive_declined: draft.intensive_declined ?? 0,
      intensive_closes: draft.intensive_closes ?? 0,
      intensive_waitlist_mode: !!draft.intensive_waitlist_mode,
      intensive_price: draft.intensive_price ?? 0,
      notes: draft.notes ?? "",
      title: draft.title ?? "",
      workshop_date: draft.workshop_date!,
      registration_window_start: draft.registration_window_start!,
      registration_window_end: draft.registration_window_end!,
    };
    const { error } = await supabase.from("workshops").update(payload).eq("id", selectedId);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Workshop updated" });
    qc.invalidateQueries({ queryKey: ["workshops"] });
    qc.invalidateQueries({ queryKey: ["workshop-funnel"] });
  };

  const numField = (key: keyof Workshop, label: string, placeholder = "0") => (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      <Input
        type="number"
        value={(draft[key] as number | null) ?? ""}
        onChange={(e) =>
          setDraft((d) => ({ ...d, [key]: e.target.value === "" ? (key === "attended" ? null : 0) : Number(e.target.value) }))
        }
        placeholder={placeholder}
        className="h-8 text-xs bg-background font-mono"
      />
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground font-display">Workshops</CardTitle>
          <div className="flex items-center gap-2">
            {!creatingNew && (
              <>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="h-8 text-xs bg-background min-w-[260px]">
                    <SelectValue placeholder={isLoading ? "Loading…" : "Select workshop"} />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">
                        {w.workshop_date} — {w.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => setCreatingNew(true)} className="text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />New
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {creatingNew ? (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Workshop Date</label>
                <Input type="date" value={newWorkshop.workshop_date} onChange={(e) => setNewWorkshop({ ...newWorkshop, workshop_date: e.target.value })} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Title</label>
                <Input value={newWorkshop.title} onChange={(e) => setNewWorkshop({ ...newWorkshop, title: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Reg Window Start</label>
                <Input type="date" value={newWorkshop.registration_window_start} onChange={(e) => setNewWorkshop({ ...newWorkshop, registration_window_start: e.target.value })} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Reg Window End</label>
                <Input type="date" value={newWorkshop.registration_window_end} onChange={(e) => setNewWorkshop({ ...newWorkshop, registration_window_end: e.target.value })} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Intensive Price ($)</label>
                <Input type="number" value={newWorkshop.intensive_price} onChange={(e) => setNewWorkshop({ ...newWorkshop, intensive_price: Number(e.target.value) || 0 })} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={newWorkshop.intensive_waitlist_mode} onCheckedChange={(v) => setNewWorkshop({ ...newWorkshop, intensive_waitlist_mode: v })} />
                <span className="text-xs text-muted-foreground">Waitlist mode</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving} className="text-xs">
                {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}Create Workshop
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatingNew(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        ) : selectedId && draft.workshop_date ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Workshop Date</label>
                <Input type="date" value={draft.workshop_date} onChange={(e) => setDraft((d) => ({ ...d, workshop_date: e.target.value }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Title</label>
                <Input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="h-8 text-xs bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Reg Window Start</label>
                <Input type="date" value={draft.registration_window_start ?? ""} onChange={(e) => setDraft((d) => ({ ...d, registration_window_start: e.target.value }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Reg Window End</label>
                <Input type="date" value={draft.registration_window_end ?? ""} onChange={(e) => setDraft((d) => ({ ...d, registration_window_end: e.target.value }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Intensive Price ($)</label>
                <Input type="number" value={draft.intensive_price ?? 0} onChange={(e) => setDraft((d) => ({ ...d, intensive_price: Number(e.target.value) || 0 }))} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={!!draft.intensive_waitlist_mode} onCheckedChange={(v) => setDraft((d) => ({ ...d, intensive_waitlist_mode: v }))} />
                <span className="text-xs text-muted-foreground">Waitlist mode</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {numField("total_registrations", "Total Registrations")}
              {numField("meta_attributed_registrations", "Meta Attributed")}
              {numField("attended", "Attended (blank if unknown)")}
              {numField("intensive_applications", "Intensive Applications")}
              {numField("intensive_declined", "Intensive Declined")}
              {numField("intensive_closes", "Intensive Closes")}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="text-xs bg-background min-h-[60px]" />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
                {saving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}Save Workshop
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">No workshops yet — click "New" to create one.</p>
        )}
      </CardContent>
    </Card>
  );
}
