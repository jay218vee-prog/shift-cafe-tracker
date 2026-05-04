import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Settings from "./pages/Settings.tsx";
import Employees from "./pages/Employees.tsx";
import Shifts from "./pages/Shifts.tsx";
import Roles from "./pages/Roles.tsx";
import Reports from "./pages/Reports.tsx";
import Printer from "./pages/Printer.tsx";
import { getCurrentUser, hasPermission } from "./lib/storage.ts";
import type { Permission } from "./lib/types.ts";

const queryClient = new QueryClient();

const Guard = ({
  perm,
  children,
}: {
  perm: Permission;
  children: React.ReactNode;
}) => (hasPermission(perm) ? <>{children}</> : <Navigate to="/settings" replace />);

const App = () => {
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const setup = async () => {
      try {
        await CapApp.addListener("backButton", () => {
          if (window.location.pathname === "/") CapApp.exitApp();
          else window.history.back();
        });
      } catch {
        /* not running on native */
      }
    };
    setup();
    return () => {
      CapApp.removeAllListeners().catch(() => {});
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {!user ? (
              <Route path="*" element={<Login onLogin={() => setUser(getCurrentUser())} />} />
            ) : (
              <>
                <Route path="/" element={<Index />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                  path="/settings/employees"
                  element={
                    <Guard perm="settings.employees">
                      <Employees />
                    </Guard>
                  }
                />
                <Route
                  path="/settings/shifts"
                  element={
                    <Guard perm="settings.shifts">
                      <Shifts />
                    </Guard>
                  }
                />
                <Route
                  path="/settings/roles"
                  element={
                    <Guard perm="settings.roles">
                      <Roles />
                    </Guard>
                  }
                />
                <Route
                  path="/settings/printer"
                  element={
                    <Guard perm="settings.printer">
                      <Printer />
                    </Guard>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
