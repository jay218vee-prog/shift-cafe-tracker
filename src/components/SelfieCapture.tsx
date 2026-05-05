import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onCancel: () => void;
  onCapture: (dataUrl: string) => void;
  autoCaptureSeconds?: number;
}

export const SelfieCapture = ({
  open,
  onCancel,
  onCapture,
  autoCaptureSeconds = 3,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [count, setCount] = useState(autoCaptureSeconds);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);
    setCount(autoCaptureSeconds);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        console.error(e);
        toast.error("Camera unavailable");
        onCancel();
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !ready) return;
    if (count <= 0) {
      capture();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ready, count]);

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const size = Math.min(v.videoWidth, v.videoHeight) || 480;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    // mirror
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);
    const data = canvas.toDataURL("image/jpeg", 0.7);
    onCapture(data);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle>Selfie Check-in</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {ready && count > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-7xl font-bold text-white drop-shadow-lg tabular-nums">
                {count}
              </div>
            </div>
          )}
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Starting camera…
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Skip
          </Button>
          <Button
            className="flex-1"
            disabled={!ready}
            onClick={() => {
              setCount(0);
              capture();
            }}
          >
            <Camera className="w-4 h-4 mr-1" /> Capture
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};