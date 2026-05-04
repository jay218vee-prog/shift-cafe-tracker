import { useRef, useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bluetooth, BluetoothConnected, Printer } from "lucide-react";
import { NiimbotBluetoothClient, ImageEncoder } from "@mmote/niimbluelib";

const PRINTER_KEY = "ctrk.printerCfg";

type Cfg = {
  widthMm: number;
  heightMm: number;
  density: number;
  direction: "left" | "top";
  text: string;
};

const loadCfg = (): Cfg => {
  try {
    const raw = localStorage.getItem(PRINTER_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
};
const defaults: Cfg = {
  widthMm: 50,
  heightMm: 30,
  density: 3,
  direction: "left",
  text: "TEST PRINT",
};

// Niimbot B1 = 203 dpi -> 8 dots per mm
const MM_TO_DOTS = 8;

const Printer_ = () => {
  const [cfg, setCfg] = useState<Cfg>(loadCfg());
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<NiimbotBluetoothClient | null>(null);

  const update = (patch: Partial<Cfg>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    localStorage.setItem(PRINTER_KEY, JSON.stringify(next));
  };

  // Round canvas dims to multiple of 8 for B1 bitmap encoding
  const widthDots = Math.max(8, Math.round((cfg.widthMm * MM_TO_DOTS) / 8) * 8);
  const heightDots = Math.max(8, Math.round((cfg.heightMm * MM_TO_DOTS) / 8) * 8);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = widthDots;
    c.height = heightDots;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, c.width - 4, c.height - 4);
    // text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fontSize = Math.min(c.height / 3, c.width / Math.max(6, cfg.text.length));
    fontSize = Math.max(14, Math.floor(fontSize));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(cfg.text || "TEST PRINT", c.width / 2, c.height / 2);
  }, [cfg.text, widthDots, heightDots]);

  const connect = async () => {
    try {
      setBusy(true);
      const client = new NiimbotBluetoothClient();
      client.on("connect", () => setConnected(true));
      client.on("disconnect", () => setConnected(false));
      await client.connect();
      clientRef.current = client;
      toast.success("Printer connected");
    } catch (e: any) {
      toast.error("Connect failed: " + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      await clientRef.current?.disconnect();
    } catch {}
    clientRef.current = null;
    setConnected(false);
  };

  const print = async () => {
    const client = clientRef.current;
    const canvas = canvasRef.current;
    if (!client || !canvas) {
      toast.error("Not connected");
      return;
    }
    try {
      setBusy(true);
      const encoded = ImageEncoder.encodeCanvas(canvas, cfg.direction);
      const printTaskName = client.getPrintTaskType() ?? "B1";
      const printTask = client.abstraction.newPrintTask(printTaskName, {
        totalPages: 1,
        statusPollIntervalMs: 100,
        statusTimeoutMs: 8000,
      });
      await printTask.printInit();
      await printTask.printPage(encoded, 1);
      await printTask.waitForPageFinished();
      await printTask.waitForFinished();
      await printTask.printEnd();
      toast.success("Printed");
    } catch (e: any) {
      toast.error("Print failed: " + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-5 space-y-4 max-w-xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Niimbot Printer</h2>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Connection</div>
          <div className="flex items-center gap-2">
            {connected ? (
              <Button onClick={disconnect} variant="destructive" disabled={busy}>
                <BluetoothConnected className="w-4 h-4 mr-1" /> Disconnect
              </Button>
            ) : (
              <Button onClick={connect} disabled={busy} className="gradient-primary text-primary-foreground">
                <Bluetooth className="w-4 h-4 mr-1" /> Connect via Bluetooth
              </Button>
            )}
            <span className={`text-xs ${connected ? "text-accent" : "text-muted-foreground"}`}>
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Requires Web Bluetooth (Chrome / Capacitor Android). Tested on Niimbot B1.
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Label size</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Width (mm)</Label>
              <Input
                type="number"
                value={cfg.widthMm}
                onChange={(e) => update({ widthMm: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Height (mm)</Label>
              <Input
                type="number"
                value={cfg.heightMm}
                onChange={(e) => update({ heightMm: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Direction</Label>
              <Select value={cfg.direction} onValueChange={(v: "left" | "top") => update({ direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text</Label>
              <Input value={cfg.text} onChange={(e) => update({ text: e.target.value })} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Canvas: {widthDots} × {heightDots} dots (203 dpi)
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Preview</div>
          <div className="flex justify-center bg-muted p-3 rounded-lg overflow-auto">
            <canvas
              ref={canvasRef}
              className="bg-white"
              style={{ imageRendering: "pixelated", maxWidth: "100%" }}
            />
          </div>
          <Button
            onClick={print}
            disabled={!connected || busy}
            className="w-full h-12 gradient-primary text-primary-foreground"
          >
            <Printer className="w-4 h-4 mr-1" /> Test Print
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Printer_;
