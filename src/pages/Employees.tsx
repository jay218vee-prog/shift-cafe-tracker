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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  loadEmployees,
  loadRoles,
  loadShifts,
  saveEmployees,
} from "@/lib/storage";
import type { Employee } from "@/lib/types";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const blank = (): Employee => ({
  id: crypto.randomUUID(),
  name: "",
  pin: "",
  roleId: loadRoles()[0]?.id ?? "",
  baseRate: 100,
  shiftRates: {},
});

const Employees = () => {
  const [list, setList] = useState<Employee[]>(loadEmployees());
  const [editing, setEditing] = useState<Employee | null>(null);
  const roles = loadRoles();
  const shifts = loadShifts();

  const persist = (next: Employee[]) => {
    setList(next);
    saveEmployees(next);
  };

  const openNew = () => setEditing(blank());
  const openEdit = (e: Employee) =>
    setEditing({ ...e, shiftRates: { ...e.shiftRates } });

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name required");
    if (!/^\d{4,6}$/.test(editing.pin))
      return toast.error("PIN must be 4-6 digits");
    if (
      list.some(
        (e) => e.id !== editing.id && e.pin === editing.pin
      )
    )
      return toast.error("PIN already used");
    const exists = list.some((e) => e.id === editing.id);
    persist(
      exists
        ? list.map((e) => (e.id === editing.id ? editing : e))
        : [...list, editing]
    );
    setEditing(null);
    toast.success("Saved");
  };

  const remove = (id: string) => {
    if (id === "e_admin") return toast.error("Cannot delete default admin");
    if (!confirm("Delete employee?")) return;
    persist(list.filter((e) => e.id !== id));
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
          <h2 className="text-2xl font-bold flex-1">Employees</h2>
          <Button onClick={openNew} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <Card className="divide-y">
          {list.map((e) => {
            const role = roles.find((r) => r.id === e.roleId);
            return (
              <div key={e.id} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {role?.name ?? "—"} · ₱{e.baseRate}/hr · PIN ••••
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(e)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {list.some((e) => e.id === editing?.id)
                ? "Edit Employee"
                : "Add Employee"}
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
                <Label>PIN (4-6 digits)</Label>
                <Input
                  value={editing.pin}
                  inputMode="numeric"
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={editing.roleId}
                  onValueChange={(v) =>
                    setEditing({ ...editing, roleId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Base rate (₱/hr)</Label>
                <Input
                  type="number"
                  value={editing.baseRate}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      baseRate: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Rates per shift</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Leave blank to use the shift's default rate.
                </p>
                <div className="space-y-2">
                  {shifts.map((s) => {
                    const v = editing.shiftRates[s.id];
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            default ₱{s.defaultRate}/hr
                          </div>
                        </div>
                        <Input
                          className="w-24"
                          type="number"
                          placeholder={String(s.defaultRate)}
                          value={v ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const next = { ...editing.shiftRates };
                            if (raw === "") delete next[s.id];
                            else next[s.id] = Number(raw);
                            setEditing({ ...editing, shiftRates: next });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
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

export default Employees;
