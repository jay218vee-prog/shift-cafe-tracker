import { useState } from "react";
import { Coffee, Delete } from "lucide-react";
import { loadEmployees, setCurrentUser } from "@/lib/storage";
import { toast } from "sonner";

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [pin, setPin] = useState("");
  const employees = loadEmployees();

  const submit = (p: string) => {
    const e = employees.find((u) => u.pin === p);
    if (e) {
      setCurrentUser(e);
      toast.success(`Welcome, ${e.name}`);
      onLogin();
    } else {
      toast.error("Invalid PIN");
      setPin("");
    }
  };

  const press = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length >= 4) {
      const found = employees.find((u) => u.pin === next);
      if (found) submit(next);
    }
  };

  const back = () => setPin(pin.slice(0, -1));

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background p-6">
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mb-4">
        <Coffee className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Cafein Tracker</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your PIN</p>

      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              pin.length > i ? "bg-primary border-primary" : "border-border"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="aspect-square text-2xl font-semibold bg-card rounded-2xl shadow-soft active:scale-95 transition-smooth"
          >
            {k}
          </button>
        ))}
        <div />
        <button
          onClick={() => press("0")}
          className="aspect-square text-2xl font-semibold bg-card rounded-2xl shadow-soft active:scale-95 transition-smooth"
        >
          0
        </button>
        <button
          onClick={back}
          className="aspect-square flex items-center justify-center bg-secondary rounded-2xl shadow-soft active:scale-95 transition-smooth"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        Default admin PIN: 1234
      </p>
    </div>
  );
};

export default Login;
