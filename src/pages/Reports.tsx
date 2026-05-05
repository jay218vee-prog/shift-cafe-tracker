import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  loadEmployees,
  loadEntries,
  loadShifts,
  hasPermission,
  deleteEntry,
  formatDuration,
  calcHours,
  getCurrentUser,
} from "@/lib/storage";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const [, setRev] = useState(0);
  const refresh = () => setRev((r) => r + 1);
  const employees = loadEmployees();
  const shifts = loadShifts();
  const entries = loadEntries();
  const user = getCurrentUser()!;
  const canViewAll = hasPermission("reports.view");
  const canEdit = hasPermission("reports.edit_entries");

  const list = useMemo(() => {
    return canViewAll ? entries : entries.filter((e) => e.employeeId === user.id);
  }, [entries, canViewAll, user.id]);

  const totals = useMemo(() => {
    let ms = 0;
    let pay = 0;
    list.forEach((e) => {
      const end = e.endedAt ?? Date.now();
      const dur = end - e.startedAt;
      ms += dur;
      pay += calcHours(dur) * e.rate;
    });
    return { ms, pay };
  }, [list]);

  const remove = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    deleteEntry(id);
    refresh();
    toast.success("Deleted");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Time Reports</h2>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total time</div>
            <div className="text-xl font-bold tabular-nums">
              {formatDuration(totals.ms)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total pay</div>
            <div className="text-xl font-bold text-accent">
              ₱{totals.pay.toFixed(2)}
            </div>
          </Card>
        </div>

        <Card className="divide-y">
          {list.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No time entries yet.
            </div>
          )}
          {list.map((e) => {
            const emp = employees.find((x) => x.id === e.employeeId);
            const sh = shifts.find((x) => x.id === e.shiftId);
            const end = e.endedAt ?? Date.now();
            const dur = end - e.startedAt;
            const pay = calcHours(dur) * e.rate;
            return (
              <div key={e.id} className="p-3 flex items-center gap-3">
                {e.selfie ? (
                  <img
                    src={e.selfie}
                    alt="selfie"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {emp?.name ?? "?"} · {sh?.name ?? "?"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.startedAt).toLocaleString()}
                    {e.endedAt
                      ? ` → ${new Date(e.endedAt).toLocaleTimeString()}`
                      : " · running"}
                  </div>
                  <div className="text-xs">
                    {formatDuration(dur)} @ ₱{e.rate}/hr ·{" "}
                    <span className="text-accent font-semibold">
                      ₱{pay.toFixed(2)}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(e.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      </main>
    </div>
  );
};

export default Reports;
