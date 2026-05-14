import { useRef, useState, useCallback } from "react";

export type CamState = "idle" | "requesting" | "active" | "denied" | "unavailable";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>("idle");
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const start = useCallback(async (mode: "user" | "environment" = "user") => {
    if (!navigator.mediaDevices?.getUserMedia) { setState("unavailable"); return; }
    setState("requesting");
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setState("active");
    } catch (e: unknown) {
      setState((e as { name?: string })?.name === "NotAllowedError" ? "denied" : "unavailable");
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const flip = useCallback(() => {
    const next: "user" | "environment" = facing === "user" ? "environment" : "user";
    setFacing(next);
    start(next);
  }, [facing, start]);

  return { videoRef, state, start, stop, flip, facing };
}
