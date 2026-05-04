import { useRef, useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bluetooth, BluetoothConnected, Printer as PrinterIcon } from "lucide-react";
import { NiimbotBluetoothClient, NiimbotCapacitorBleClient, ImageEncoder, NiimbotAbstractClient } from "@mmote/niimbluelib";
import { Device } from "@capacitor/device";

const PRINTER_KEY = "ctrk.printerCfg";

type Cfg = {
  widthMm: number;
  heightMm: number;
  density: number;
  speed: number;
  direction: "top" | "right" | "bottom" | "left";
  text: string;
};

const defaults: Cfg = {
  widthMm: 50,
  heightMm: 30,
  density: 3,
  speed: 3,
  direction: "top",
  text: "TEST PRINT",
};

const loadCfg = (): Cfg => {
  try {
    const raw = localStorage.getItem(PRINTER_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
};

// Niimbot B1 = 203 dpi -> 8 dots per mm
const MM_TO_DOTS = 8;

const Printer_ = () => {
  const [cfg, setCfg] = useState<Cfg>(loadCfg());
  const [densityInput, setDensityInput] = useState(cfg.density.toString());
  const [speedInput, setSpeedInput] = useState(cfg.speed.toString());

  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<NiimbotAbstractClient | null>(null);

  const update = (patch: Partial<Cfg>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    localStorage.setItem(PRINTER_KEY, JSON.stringify(next));
  };

  // Logic: The canvas always represents the PHYSICAL label as you see it.
  // We don't swap dots here anymore; ImageEncoder handles the rotation.
  const widthDots = Math.max(8, Math.round((cfg.widthMm * MM_TO_DOTS) / 8) * 8);
  const heightDots = Math.max(8, Math.round((cfg.heightMm * MM_TO_DOTS) / 8) * 8);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    // Set actual canvas size to match label aspect ratio
    c.width = widthDots;
    c.height = heightDots;

    const ctx = c.getContext("2d")!;
    // 1. Clear background to absolute white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);

    // 2. Draw border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, c.width - 4, c.height - 4);

    // 3. Draw text in the center
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const printText = cfg.text.trim() || "TEST PRINT";
    let fontSize = Math.min(c.height / 2, c.width / Math.max(4, printText.length));
    fontSize = Math.max(16, Math.floor(fontSize));

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(printText, c.width / 2, c.height / 2);
  }, [cfg.text, widthDots, heightDots]);

  const connect = async () => {
    try {
      setBusy(true);
      const info = await Device.getInfo();
      const client = info.platform === "android" || info.platform === "ios"
        ? new NiimbotCapacitorBleClient()
        : new NiimbotBluetoothClient();

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
      // We pass the canvas and the rotation direction.
      // "top" is typically 0 deg, "right" 90, "bottom" 180, "left" 270.
      const encoded = ImageEncoder.encodeCanvas(canvas, cfg.direction);
      const printTaskName = client.getPrintTaskType() ?? "B1";

      const printTask = client.abstraction.newPrintTask(printTaskName, {
        totalPages: 1,
        statusPollIntervalMs: 100,
        statusTimeoutMs: 8000,
        density: cfg.density,
        speed: cfg.speed,
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
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Label Configuration</div>
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
              <Label>Density (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={densityInput}
                onChange={(e) => {
                  setDensityInput(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) update({ density: val });
                }}
              />
            </div>
            <div>
              <Label>Speed (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={speedInput}
                onChange={(e) => {
                  setSpeedInput(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) update({ speed: val });
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Text Orientation</Label>
              <Select value={cfg.direction} onValueChange={(v: any) => update({ direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Standard (0°)</SelectItem>
                  <SelectItem value="right">Rotated (90°)</SelectItem>
                  <SelectItem value="bottom">Upside Down (180°)</SelectItem>
                  <SelectItem value="left">Rotated (270°)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Print Content</Label>
              <Input
                placeholder="What to print..."
                value={cfg.text}
                onChange={(e) => update({ text: e.target.value })}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Label Resolution: {widthDots} × {heightDots} dots
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Live Preview</div>
          <div className="flex justify-center bg-muted p-6 rounded-lg overflow-auto">
            <canvas
              ref={canvasRef}
              className="bg-white shadow-lg border border-gray-200"
              style={{
                imageRendering: "pixelated",
                maxWidth: "100%",
                height: "auto"
              }}
            />
          </div>
          <Button
            onClick={print}
            disabled={!connected || busy}
            className="w-full h-12 gradient-primary text-primary-foreground"
          >
            <PrinterIcon className="w-4 h-4 mr-1" /> Test Print
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Printer_;
