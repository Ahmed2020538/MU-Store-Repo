import { useScroll, useSpring, motion } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none"
      style={{
        scaleX,
        transformOrigin: "0%",
        background: "linear-gradient(90deg, #C9A96E, #E8C98A 50%, #C9A96E)",
      }}
    />
  );
}
