import type { Employee, Permission, Role, Shift, TimeEntry } from "./types";

const KEYS = {
  employees: "ctrk.employees",
  roles: "ctrk.roles",
  shifts: "ctrk.shifts",
  entries: "ctrk.entries",
  currentUser: "ctrk.currentUser",
};

export const defaultRoles: Role[] = [
  {
    id: "r_admin",
    name: "Admin",
    permissions: [
      "settings.employees",
      "settings.shifts",
      "settings.roles",
      "settings.printer",
      "reports.view",
      "reports.edit_entries",
    ],
  },
  { id: "r_staff", name: "Staff", permissions: [] },
];

export const defaultShifts: Shift[] = [
  { id: "s_morning", name: "Morning", defaultRate: 100 },
  { id: "s_evening", name: "Evening", defaultRate: 120 },
  { id: "s_night", name: "Night", defaultRate: 150 },
];

export const defaultEmployees: Employee[] = [
  {
    id: "e_admin",
    name: "Admin",
    pin: "1234",
    roleId: "r_admin",
    baseRate: 100,
    shiftRates: {},
  },
];

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, val: unknown) =>
  localStorage.setItem(key, JSON.stringify(val));

export const loadRoles = () => load<Role[]>(KEYS.roles, defaultRoles);
export const saveRoles = (r: Role[]) => save(KEYS.roles, r);

export const loadShifts = () => load<Shift[]>(KEYS.shifts, defaultShifts);
export const saveShifts = (s: Shift[]) => save(KEYS.shifts, s);

export const loadEmployees = () =>
  load<Employee[]>(KEYS.employees, defaultEmployees);
export const saveEmployees = (e: Employee[]) => save(KEYS.employees, e);

export const loadEntries = () => load<TimeEntry[]>(KEYS.entries, []);
export const saveEntries = (e: TimeEntry[]) =>
  save(KEYS.entries, e.slice(0, 5000));

export const addEntry = (e: TimeEntry) => {
  const all = loadEntries();
  all.unshift(e);
  saveEntries(all);
};
export const updateEntry = (id: string, patch: Partial<TimeEntry>) => {
  const all = loadEntries().map((x) =>
    x.id === id ? { ...x, ...patch } : x
  );
  saveEntries(all);
};
export const deleteEntry = (id: string) =>
  saveEntries(loadEntries().filter((x) => x.id !== id));

export const getCurrentUser = (): Employee | null => {
  try {
    const raw = localStorage.getItem(KEYS.currentUser);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const setCurrentUser = (e: Employee | null) => {
  if (e) localStorage.setItem(KEYS.currentUser, JSON.stringify(e));
  else localStorage.removeItem(KEYS.currentUser);
};

export const hasPermission = (p: Permission): boolean => {
  const u = getCurrentUser();
  if (!u) return false;
  if (u.id === "e_admin") return true;
  const role = loadRoles().find((r) => r.id === u.roleId);
  return role?.permissions.includes(p) ?? false;
};

export const getRateFor = (employee: Employee, shift: Shift): number => {
  const override = employee.shiftRates[shift.id];
  if (override !== undefined && override !== null && !isNaN(override))
    return override;
  return shift.defaultRate;
};

export const getActiveEntry = (employeeId: string): TimeEntry | undefined =>
  loadEntries().find((e) => e.employeeId === employeeId && e.endedAt === null);

export const formatDuration = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const calcHours = (ms: number) => ms / 3600000;
