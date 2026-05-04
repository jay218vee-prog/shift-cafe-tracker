import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { loadShifts, saveShifts } from "@/lib/storage";
import type { Shift } from "@/lib/types";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const blank = (): Shift => ({
  id: crypto.randomUUID(),
  name: "",
  defaultRate: 100,
});

const Shifts = () => {
  const [list, setList] = useState<Shift[]>(loadShifts());
  const [editing, setEditing] = useState<Shift | null>(null);

  const persist = (next: Shift[]) => {
    setList(next);
    saveShifts(next);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name required");
    const exists = list.some((s) => s.id === editing.id);
    persist(
      exists
        ? list.map((s) => (s.id === editing.id ? editing : s))
        : [...list, editing]
    );
    setEditing(null);
    toast.success("Saved");
  };

  const remove = (id: string) => {
    if (!confirm("Delete shift?")) return;
    persist(list.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-5 space-y-4 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-2xl font-bold flex-1">Shifts</h2>
          <Button onClick={() => setEditing(blank())} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <Card className="divide-y">
          {list.map((s) => (
            <div key={s.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  default ₱{s.defaultRate}/hr
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditing({ ...s })}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(s.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {list.some((s) => s.id === editing?.id)
                ? "Edit Shift"
                : "Add Shift"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 py-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Default rate (₱/hr)</Label>
                <Input
                  type="number"
                  value={editing.defaultRate}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      defaultRate: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              className="gradient-primary text-primary-foreground"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shifts;
