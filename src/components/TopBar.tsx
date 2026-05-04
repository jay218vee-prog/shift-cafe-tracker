import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock, Settings, BarChart3, LogOut, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { setCurrentUser, getCurrentUser } from "@/lib/storage";

export const TopBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const logout = () => {
    if (confirm("Logout?")) {
      setCurrentUser(null);
      navigate("/");
      window.location.reload();
    }
  };

  const navBtn = (active: boolean) =>
    cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-smooth",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground hover:bg-muted"
    );

  return (
    <header className="flex items-center justify-between px-5 py-4 bg-card shadow-soft sticky top-0 z-30">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Coffee className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-none">CAFEIN TRACKER</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {user ? `Hi, ${user.name}` : "Time Tracking"}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={logout}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-smooth"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <Link to="/" className={navBtn(pathname === "/")} aria-label="Clock">
          <Clock className="w-5 h-5" />
        </Link>
        <Link
          to="/reports"
          className={navBtn(pathname.startsWith("/reports"))}
          aria-label="Reports"
        >
          <BarChart3 className="w-5 h-5" />
        </Link>
        <Link
          to="/settings"
          className={navBtn(pathname.startsWith("/settings"))}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
