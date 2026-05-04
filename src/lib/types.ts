export type Permission =
  | "settings.employees"
  | "settings.shifts"
  | "settings.roles"
  | "reports.view"
  | "reports.edit_entries";

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Shift {
  id: string;
  name: string;
  defaultRate: number; // peso/hr fallback when an employee has no override
}

export interface Employee {
  id: string;
  name: string;
  pin: string;
  roleId: string;
  baseRate: number; // default $/hr
  shiftRates: Record<string, number>; // shiftId -> rate override
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  shiftId: string;
  rate: number; // snapshot at clock-in
  startedAt: number;
  endedAt: number | null;
  note?: string;
}
