import { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function PremiumCursor() {
  const [visible, setVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const pos = useRef({ x: -200, y: -200 });
  const [dot, setDot] = useState({ x: -200, y: -200 });

  const ringX = useSpring(-200, { stiffness: 160, damping: 22 });
  const ringY = useSpring(-200, { stiffness: 160, damping: 22 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      setDot({ x: e.clientX, y: e.clientY });
      ringX.set(e.clientX);
      ringY.set(e.clientY);

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (el) {
        const cursor = window.getComputedStyle(el).cursor;
        setIsPointer(cursor === "pointer" || cursor === "text");
      }
    };

    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [ringX, ringY]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <>
      {/* Dot — snaps instantly */}
      <div
        className="fixed pointer-events-none z-[9999] rounded-full"
        style={{
          width: isPointer ? 0 : 8,
          height: isPointer ? 0 : 8,
          background: "#C9A96E",
          transform: `translate(${dot.x - 4}px, ${dot.y - 4}px)`,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s, width 0.2s, height 0.2s",
          top: 0,
          left: 0,
        }}
      />
      {/* Ring — lags behind for premium feel */}
      <motion.div
        className="fixed pointer-events-none z-[9998] rounded-full border border-[#C9A96E]"
        style={{
          width: isPointer ? 44 : 30,
          height: isPointer ? 44 : 30,
          x: ringX,
          y: ringY,
          translateX: isPointer ? -22 : -15,
          translateY: isPointer ? -22 : -15,
          opacity: visible ? (isPointer ? 0.7 : 0.45) : 0,
          top: 0,
          left: 0,
          transition: "opacity 0.2s, width 0.25s, height 0.25s, translateX 0.25s, translateY 0.25s",
        }}
      />
    </>
  );
}
