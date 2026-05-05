import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addEntry,
  formatDuration,
  getActiveEntry,
  getCurrentUser,
  getRateFor,
  loadEmployees,
  loadShifts,
  updateEntry,
  calcHours,
} from "@/lib/storage";
import type { TimeEntry } from "@/lib/types";
import { toast } from "sonner";
import { Play, Square, Clock } from "lucide-react";
import { SelfieCapture } from "@/components/SelfieCapture";

const Index = () => {
  const [active, setActive] = useState<TimeEntry | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [shiftId, setShiftId] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [pending, setPending] = useState<{ shiftId: string; rate: number } | null>(null);
  const user = getCurrentUser()!;
  const shifts = loadShifts();

  useEffect(() => {
    setActive(getActiveEntry(user.id));
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [user.id]);

  const openClockIn = () => {
    const first = shifts[0];
    if (!first) {
      toast.error("No shifts configured");
      return;
    }
    setShiftId(first.id);
    setRate(getRateFor(user, first));
    setOpen(true);
  };

  const onShiftChange = (id: string) => {
    setShiftId(id);
    const sh = shifts.find((s) => s.id === id);
    if (sh) setRate(getRateFor(user, sh));
  };

  const clockIn = () => {
    setPending({ shiftId, rate });
    setOpen(false);
    setSelfieOpen(true);
  };

  const finalizeClockIn = (selfie: string) => {
    if (!pending) return;
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      employeeId: user.id,
      shiftId: pending.shiftId,
      rate: pending.rate,
      startedAt: Date.now(),
      endedAt: null,
      selfie,
    };
    addEntry(entry);
    setActive(entry);
    setPending(null);
    setSelfieOpen(false);
    toast.success("Clocked in");
  };

  const clockOut = () => {
    if (!active) return;
    if (!confirm("Clock out now?")) return;
    updateEntry(active.id, { endedAt: Date.now() });
    setActive(undefined);
    toast.success("Clocked out");
  };

  const elapsedMs = active ? Date.now() - active.startedAt : 0;
  const earned = active ? calcHours(elapsedMs) * active.rate : 0;
  const activeShift = active
    ? shifts.find((s) => s.id === active.shiftId)
    : null;

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-5 space-y-5 max-w-xl mx-auto w-full">
        <Card className="p-6 text-center shadow-elevated">
          <div className="text-sm text-muted-foreground mb-2">
            {active ? "Currently clocked in" : "Not clocked in"}
          </div>
          {active ? (
            <>
              <div className="text-5xl font-bold tabular-nums tracking-tight my-3">
                {formatDuration(elapsedMs)}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {activeShift?.name} · ₱{active.rate.toFixed(2)}/hr
              </div>
              <div className="text-2xl font-semibold text-accent mb-5">
                ₱{earned.toFixed(2)}
              </div>
              <Button
                onClick={clockOut}
                size="lg"
                variant="destructive"
                className="w-full h-14 text-lg"
              >
                <Square className="w-5 h-5 mr-2 fill-current" /> Clock Out
              </Button>
            </>
          ) : (
            <>
              <div className="my-6 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-primary" />
                </div>
              </div>
              <Button
                onClick={openClockIn}
                size="lg"
                className="w-full h-14 text-lg gradient-primary text-primary-foreground"
              >
                <Play className="w-5 h-5 mr-2 fill-current" /> Clock In
              </Button>
            </>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">Quick info</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <strong className="text-foreground">{user.name}</strong> · base ₱
              {user.baseRate.toFixed(2)}/hr
            </div>
            <div>{shifts.length} shifts available</div>
          </div>
        </Card>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Start Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Shift</Label>
              <Select value={shiftId} onValueChange={onShiftChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rate per hour (₱)</Label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={clockIn}
              className="w-full gradient-primary text-primary-foreground"
            >
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelfieCapture
        open={selfieOpen}
        onCancel={() => {
          setSelfieOpen(false);
          setPending(null);
        }}
        onCapture={(d) => finalizeClockIn(d)}
      />
    </div>
  );
};

export default Index;
