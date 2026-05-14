import { useRef, useCallback, useEffect, MutableRefObject, RefObject } from "react";

// Category → sensible default overlay position & size
function defaultPos(cat: string, W: number, H: number) {
  const base = Math.min(W, H);
  const lc = cat.toLowerCase();
  if (lc.includes("eyewear") || lc.includes("sunglass"))
    return { x: W * 0.5, y: H * 0.33, s: base * 0.40 };
  if (lc.includes("hat") || lc.includes("cap"))
    return { x: W * 0.5, y: H * 0.10, s: base * 0.34 };
  if (lc.includes("bag") || lc.includes("purse") || lc.includes("accessori"))
    return { x: W * 0.72, y: H * 0.58, s: base * 0.34 };
  // shoes / heels / boots / flats — bottom of frame
  return { x: W * 0.5, y: H * 0.80, s: base * 0.58 };
}

export function useTryOnOverlay(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  productImage: string,
  categoryRef: MutableRefObject<string>,
  opacityRef: MutableRefObject<number>,
  scaleRef: MutableRefObject<number>,
) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOff = useRef({ x: 0, y: 0 });

  // Reload image whenever productImage changes; reset manual position
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
    const W = canvas.width;
    const H = canvas.height;

    // Mirror (selfie-friendly)
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();

    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      const def = defaultPos(categoryRef.current, W, H);
      const { x, y } = posRef.current ?? def;
      const s = def.s * (scaleRef.current / 100);
      const aspect = img.naturalWidth / img.naturalHeight;
      ctx.globalAlpha = opacityRef.current / 100;
      ctx.drawImage(img, x - s / 2, y - (s / aspect) / 2, s, s / aspect);
      ctx.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, canvasRef, categoryRef, opacityRef, scaleRef]);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopLoop = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  // Drag to reposition overlay
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (c.width / r.width);
    const cy = (e.clientY - r.top) * (c.height / r.height);
    const cur = posRef.current ?? defaultPos(categoryRef.current, c.width, c.height);
    dragOff.current = { x: cx - cur.x, y: cy - cur.y };
    dragging.current = true;
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
