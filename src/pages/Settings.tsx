import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Clock, Shield, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { hasPermission, setCurrentUser } from "@/lib/storage";

const Row = ({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: any;
  title: string;
  desc: string;
}) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-smooth border-b border-border/50 last:border-b-0"
  >
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </Link>
);

const Settings = () => {
  const navigate = useNavigate();
  const logout = () => {
    setCurrentUser(null);
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-6 max-w-xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-destructive"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>

        <Card className="p-2">
          {hasPermission("settings.employees") && (
            <Row
              to="/settings/employees"
              icon={Users}
              title="Employees"
              desc="Add, edit and set rates per shift"
            />
          )}
          {hasPermission("settings.shifts") && (
            <Row
              to="/settings/shifts"
              icon={Clock}
              title="Shifts"
              desc="Define shifts and default rates"
            />
          )}
          {hasPermission("settings.roles") && (
            <Row
              to="/settings/roles"
              icon={Shield}
              title="Roles & Permissions"
              desc="Hide settings from certain users"
            />
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Data is saved locally on this device.
        </p>
      </main>
    </div>
  );
};

export default Settings;
