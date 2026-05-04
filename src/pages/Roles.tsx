import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { loadRoles, saveRoles } from "@/lib/storage";
import type { Permission, Role } from "@/lib/types";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ALL_PERMS: { id: Permission; label: string }[] = [
  { id: "settings.employees", label: "Manage Employees" },
  { id: "settings.shifts", label: "Manage Shifts" },
  { id: "settings.roles", label: "Manage Roles & Permissions" },
  { id: "reports.view", label: "View All Reports" },
  { id: "reports.edit_entries", label: "Edit/Delete Time Entries" },
];

const blank = (): Role => ({
  id: crypto.randomUUID(),
  name: "",
  permissions: [],
});

const Roles = () => {
  const [list, setList] = useState<Role[]>(loadRoles());
  const [editing, setEditing] = useState<Role | null>(null);

  const persist = (next: Role[]) => {
    setList(next);
    saveRoles(next);
  };

  const toggle = (p: Permission) => {
    if (!editing) return;
    const has = editing.permissions.includes(p);
    setEditing({
      ...editing,
      permissions: has
        ? editing.permissions.filter((x) => x !== p)
        : [...editing.permissions, p],
    });
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name required");
    const exists = list.some((r) => r.id === editing.id);
    persist(
      exists
        ? list.map((r) => (r.id === editing.id ? editing : r))
        : [...list, editing]
    );
    setEditing(null);
    toast.success("Saved");
  };

  const remove = (id: string) => {
    if (id === "r_admin") return toast.error("Cannot delete Admin role");
    if (!confirm("Delete role?")) return;
    persist(list.filter((r) => r.id !== id));
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
          <h2 className="text-2xl font-bold flex-1">Roles</h2>
          <Button onClick={() => setEditing(blank())} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <Card className="divide-y">
          {list.map((r) => (
            <div key={r.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.permissions.length} permission(s)
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  setEditing({ ...r, permissions: [...r.permissions] })
                }
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(r.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {list.some((r) => r.id === editing?.id)
                ? "Edit Role"
                : "Add Role"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 py-2">
              <div>
                <Label>Role name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {ALL_PERMS.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                    >
                      <Checkbox
                        checked={editing.permissions.includes(p.id)}
                        onCheckedChange={() => toggle(p.id)}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
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

export default Roles;
