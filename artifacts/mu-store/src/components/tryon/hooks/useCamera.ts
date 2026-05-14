import { useRef, useState, useCallback, useEffect } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsActive(false);
  }, []);

  const start = useCallback(async (facing: "user" | "environment" = "user") => {
    stop();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setFacingMode(facing);
      setIsActive(true);
    } catch {
      setError("Camera access denied. Enable camera permissions in your browser settings.");
    }
  }, [stop]);

  const flip = useCallback(() => {
    start(facingMode === "user" ? "environment" : "user");
  }, [facingMode, start]);

  const capture = useCallback((): File | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const [, b64] = dataUrl.split(",");
    const bytes = atob(b64);
    const u8 = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i);
    return new File([u8], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
  }, [facingMode]);

  // Assign stream to video element after it mounts
  const attachStream = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, attachStream, isActive, error, facingMode, start, stop, flip, capture };
}
