import { useRef, useCallback, useEffect, MutableRefObject, RefObject } from "react";
import type { Landmarks } from "./usePoseDetection";
import { KP } from "./usePoseDetection";

const MIN_SCORE = 0.25;

// Category-based heuristic positions (normalized, fraction of canvas)
function defaultPos(cat: string, W: number, H: number) {
  const base = Math.min(W, H);
  const lc = cat.toLowerCase();
  if (lc.includes("eyewear") || lc.includes("sunglass"))
    return { x: W * 0.5, y: H * 0.33, s: base * 0.40 };
  if (lc.includes("hat") || lc.includes("cap"))
    return { x: W * 0.5, y: H * 0.10, s: base * 0.34 };
  if (lc.includes("bag") || lc.includes("purse") || lc.includes("accessori"))
    return { x: W * 0.72, y: H * 0.58, s: base * 0.34 };
  return { x: W * 0.5, y: H * 0.80, s: base * 0.58 }; // shoes default
}

// AI landmark-based position — mirrors X since video is mirrored
function landmarkPos(cat: string, lm: Landmarks, W: number, H: number) {
  if (!lm) return null;
  const kp = (i: number) => ({
    x: (1 - lm[i].x) * W, // mirror X
    y: lm[i].y * H,
    s: lm[i].score,
  });
  const lc = cat.toLowerCase();

  if (lc.includes("heel") || lc.includes("boot") || lc.includes("flat") || lc.includes("shoe")) {
    const la = kp(KP.L_ANKLE); const ra = kp(KP.R_ANKLE);
    if (la.s > MIN_SCORE && ra.s > MIN_SCORE) {
      const x = (la.x + ra.x) / 2;
      const y = (la.y + ra.y) / 2;
      return { x, y, s: Math.max(Math.abs(la.x - ra.x) * 2.8, Math.min(W, H) * 0.40) };
    }
    const a = la.s > ra.s ? la : ra;
    if (a.s > MIN_SCORE) return { x: a.x, y: a.y, s: Math.min(W, H) * 0.38 };
  }

  if (lc.includes("bag") || lc.includes("purse")) {
    const lw = kp(KP.L_WRIST); const rw = kp(KP.R_WRIST);
    const w = lw.s > rw.s ? lw : rw;
    if (w.s > MIN_SCORE) return { x: w.x, y: w.y, s: Math.min(W, H) * 0.32 };
    const ls = kp(KP.L_SHOULDER);
    if (ls.s > MIN_SCORE) return { x: ls.x + W * 0.08, y: ls.y + H * 0.12, s: Math.min(W, H) * 0.32 };
  }

  if (lc.includes("eyewear") || lc.includes("sunglass")) {
    const le = kp(KP.L_EYE); const re = kp(KP.R_EYE);
    if (le.s > MIN_SCORE && re.s > MIN_SCORE) {
      const x = (le.x + re.x) / 2;
      const y = (le.y + re.y) / 2;
      return { x, y, s: Math.max(Math.abs(le.x - re.x) * 4.2, Math.min(W, H) * 0.28) };
    }
  }

  if (lc.includes("hat") || lc.includes("cap")) {
    const nose = kp(KP.NOSE); const le = kp(KP.L_EYE); const re = kp(KP.R_EYE);
    if (nose.s > MIN_SCORE) {
      const fW = le.s > MIN_SCORE && re.s > MIN_SCORE
        ? Math.abs(le.x - re.x) * 4.5 : Math.min(W, H) * 0.34;
      return { x: nose.x, y: nose.y - fW * 0.75, s: fW };
    }
  }

  return null;
}

export function useTryOnOverlay(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  productImage: string,
  categoryRef: MutableRefObject<string>,
  opacityRef: MutableRefObject<number>,
  scaleRef: MutableRefObject<number>,
  landmarksRef: MutableRefObject<Landmarks>,
) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const posRef = useRef<{ x: number; y: number } | null>(null); // manual drag position
  const dragging = useRef(false);
  const dragOff = useRef({ x: 0, y: 0 });

  useEffect(() => {
    posRef.current = null;
    imgRef.current = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = productImage;
    img.onload = () => { imgRef.current = img; };
  }, [productImage]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;
    const W = canvas.width; const H = canvas.height;

    // Mirror video draw
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();

    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      const aiPos = !dragging.current
        ? landmarkPos(categoryRef.current, landmarksRef.current, W, H)
        : null;
      const def = defaultPos(categoryRef.current, W, H);
      const { x, y } = dragging.current
        ? (posRef.current ?? def)
        : (aiPos ? { x: aiPos.x, y: aiPos.y } : (posRef.current ?? def));
      const baseS = aiPos ? aiPos.s : def.s;
      const s = baseS * (scaleRef.current / 100);
      const aspect = img.naturalWidth / img.naturalHeight;
      ctx.globalAlpha = opacityRef.current / 100;
      ctx.drawImage(img, x - s / 2, y - s / aspect / 2, s, s / aspect);
      ctx.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, canvasRef, categoryRef, opacityRef, scaleRef, landmarksRef]);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopLoop = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (c.width / r.width);
    const cy = (e.clientY - r.top) * (c.height / r.height);
    const cur = posRef.current ?? defaultPos(categoryRef.current, c.width, c.height);
    dragOff.current = { x: cx - cur.x, y: cy - cur.y };
    dragging.current = true;
    posRef.current = { x: cur.x, y: cur.y };
    c.setPointerCapture(e.pointerId);
  }, [canvasRef, categoryRef]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current || !canvasRef.current) return;
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    posRef.current = {
      x: (e.clientX - r.left) * (c.width / r.width) - dragOff.current.x,
      y: (e.clientY - r.top) * (c.height / r.height) - dragOff.current.y,
    };
  }, [canvasRef]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  return { startLoop, stopLoop, onPointerDown, onPointerMove, onPointerUp };
}
