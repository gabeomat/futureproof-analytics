import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import { historicalRevenue, MonthlyRevenue, formatCurrency } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

const EMPTY_ENTRY: Omit<MonthlyRevenue, "monthShort"> = {
  month: "",
  new: 0,
  upgrades: 0,
  existing: 0,
  downgrades: 0,
  churn: 0,
  mrr: 0,
};

const MONTH_OPTIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DataEntry() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<MonthlyRevenue[]>([...historicalRevenue]);
  const [draft, setDraft] = useState<Omit<MonthlyRevenue, "monthShort">>({ ...EMPTY_ENTRY });
  const [isAdding, setIsAdding] = useState(false);

  const updateDraft = (field: keyof typeof draft, value: string) => {
    if (field === "month") {
      setDraft((d) => ({ ...d, month: value }));
    } else {
      const num = value === "" || value === "-" ? 0 : Number(value);
      if (value !== "" && value !== "-" && isNaN(num)) return;
      setDraft((d) => ({ ...d, [field]: value === "" || value === "-" ? value : num }));
    }
  };

  const autoCalcMRR = () => {
    const newVal = typeof draft.new === "number" ? draft.new : 0;
    const upgrades = typeof draft.upgrades === "number" ? draft.upgrades : 0;
    const existing = typeof draft.existing === "number" ? draft.existing : 0;
    const downgrades = typeof draft.downgrades === "number" ? draft.downgrades : 0;
    const churn = typeof draft.churn === "number" ? draft.churn : 0;
    return newVal + upgrades + existing + downgrades + churn;
  };

  const handleAdd = () => {
    if (!draft.month.trim()) {
      toast({ title: "Month required", description: "Please enter a month label (e.g. 'Apr 2026').", variant: "destructive" });
      return;
    }
    const shortMatch = draft.month.match(/^([A-Za-z]{3})/);
    const monthShort = shortMatch ? shortMatch[1].charAt(0).toUpperCase() + shortMatch[1].slice(1).toLowerCase() : draft.month.slice(0, 3);
    
    const entry: MonthlyRevenue = {
      ...draft,
      monthShort,
      new: typeof draft.new === "number" ? draft.new : 0,
      upgrades: typeof draft.upgrades === "number" ? draft.upgrades : 0,
      existing: typeof draft.existing === "number" ? draft.existing : 0,
      downgrades: typeof draft.downgrades === "number" ? draft.downgrades : 0,
      churn: typeof draft.churn === "number" ? draft.churn : 0,
      mrr: typeof draft.mrr === "number" ? draft.mrr : autoCalcMRR(),
    };

    setEntries((prev) => [...prev, entry]);
    setDraft({ ...EMPTY_ENTRY });
    setIsAdding(false);
    toast({ title: "Entry added", description: `${entry.month} data saved.` });
  };

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Entry removed" });
  };

  const handleExportCSV = () => {
    const headers = ["Month", "New", "Upgrades", "Existing", "Downgrades", "Churn", "MRR"];
    const rows = entries.map((e) => [e.month, e.new, e.upgrades, e.existing, e.downgrades, e.churn, e.mrr].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "futureproof-revenue-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Entry Form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground font-display">
              Monthly Revenue Data
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              {!isAdding && (
                <Button size="sm" onClick={() => setIsAdding(true)} className="text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Month
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-xs font-mono">Month</TableHead>
                  <TableHead className="text-xs font-mono text-right">New</TableHead>
                  <TableHead className="text-xs font-mono text-right">Upgrades</TableHead>
                  <TableHead className="text-xs font-mono text-right">Existing</TableHead>
                  <TableHead className="text-xs font-mono text-right">Downgrades</TableHead>
                  <TableHead className="text-xs font-mono text-right">Churn</TableHead>
                  <TableHead className="text-xs font-mono text-right">MRR</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={i} className="group">
                    <TableCell className="text-xs font-medium text-foreground">{entry.month}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-emerald-400">
                      {entry.new > 0 ? `+${formatCurrency(entry.new)}` : formatCurrency(entry.new)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-emerald-400">
                      {entry.upgrades > 0 ? `+${formatCurrency(entry.upgrades)}` : formatCurrency(entry.upgrades)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">
                      {formatCurrency(entry.existing)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-amber-400">
                      {formatCurrency(entry.downgrades)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-red-400">
                      {formatCurrency(entry.churn)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono font-semibold text-primary">
                      {formatCurrency(entry.mrr)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleRemove(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Inline add row */}
                {isAdding && (
                  <TableRow className="bg-primary/5">
                    <TableCell>
                      <Input
                        value={draft.month}
                        onChange={(e) => updateDraft("month", e.target.value)}
                        placeholder="Apr 2026"
                        className="h-7 text-xs w-24 bg-background"
                      />
                    </TableCell>
                    {(["new", "upgrades", "existing", "downgrades", "churn", "mrr"] as const).map((field) => (
                      <TableCell key={field} className="text-right">
                        <Input
                          type="text"
                          value={draft[field] === 0 ? "" : String(draft[field])}
                          onChange={(e) => updateDraft(field, e.target.value)}
                          placeholder={field === "mrr" ? String(autoCalcMRR()) : "0"}
                          className="h-7 text-xs w-20 text-right font-mono bg-background ml-auto"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleAdd} className="h-7 px-2 text-xs">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setDraft({ ...EMPTY_ENTRY }); }} className="h-7 px-2 text-xs">
                          ✕
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Enter your Skool MRR breakdown each month. Churn &amp; downgrades should be negative values. MRR auto-calculates if left blank.
          </p>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Months Tracked</p>
            <p className="text-xl font-bold font-mono text-foreground mt-1">{entries.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Latest MRR</p>
            <p className="text-xl font-bold font-mono text-primary mt-1">
              {entries.length > 0 ? formatCurrency(entries[entries.length - 1].mrr) : "$0"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total New Revenue</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {formatCurrency(entries.reduce((sum, e) => sum + e.new, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Churned</p>
            <p className="text-xl font-bold font-mono text-red-400 mt-1">
              {formatCurrency(Math.abs(entries.reduce((sum, e) => sum + e.churn, 0)))}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
