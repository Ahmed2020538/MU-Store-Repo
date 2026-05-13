import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SOCIAL_PLATFORMS } from "@/lib/social-config";

type Variant = "compact" | "expanded" | "footer";

interface Props {
  size?: "sm" | "md" | "lg";
  direction?: "row" | "col";
  showLabels?: boolean;
  variant?: Variant;
  data?: Record<string, { active: boolean; value: string; order: number }>;
}

const SIZE_MAP = { sm: 16, md: 20, lg: 26 };
const CIRCLE_MAP = { sm: "w-9 h-9", md: "w-10 h-10", lg: "w-14 h-14" };

function useActivePlatforms(data?: Record<string, any>) {
  const [social, setSocial] = useState<Record<string, any>>(data ?? {});
  useEffect(() => {
    if (data) { setSocial(data); return; }
    const cached = sessionStorage.getItem("mu_social_v2");
    if (cached) { setSocial(JSON.parse(cached)); return; }
    fetch("/api/settings/social").then(r => r.json()).then(d => {
      setSocial(d);
      sessionStorage.setItem("mu_social_v2", JSON.stringify(d));
    }).catch(() => {});
  }, [data]);

  return SOCIAL_PLATFORMS
    .map(p => ({ ...p, cfg: social[p.key] }))
    .filter(p => p.cfg?.active && p.cfg?.value)
    .sort((a, b) => (a.cfg?.order ?? 99) - (b.cfg?.order ?? 99));
}

/* ── Compact pill icon (used in sidebars, small contexts) ── */
function CompactIcon({ p, size }: { p: any; size: "sm" | "md" | "lg" }) {
  const [hov, setHov] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <div
      className="relative"
      onMouseEnter={() => { setHov(true); tipTimer.current = setTimeout(() => setShowTip(true), 400); }}
      onMouseLeave={() => { setHov(false); setShowTip(false); clearTimeout(tipTimer.current); }}
    >
      <motion.a
        href={p.buildUrl(p.cfg.value)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow us on ${p.label}`}
        animate={{
          backgroundColor: hov ? p.bgColor : "#1A1A2E",
          scale: hov ? 1.12 : 1,
          y: hov ? -3 : 0,
          boxShadow: hov ? `0 6px 20px ${p.bgColor}55` : "0 0 0 transparent",
        }}
        transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
        className={`${CIRCLE_MAP[size]} rounded-full flex items-center justify-center flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]`}
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        whileTap={{ scale: 0.88 }}
      >
        <motion.span animate={{ color: hov ? "#fff" : p.color }} transition={{ duration: 0.15 }}>
          <p.Icon size={SIZE_MAP[size]} />
        </motion.span>
      </motion.a>
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            role="tooltip"
          >
            <div
              className="text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
              style={{ backgroundColor: p.bgColor }}
            >
              Follow us on {p.label}
            </div>
            <div className="w-2 h-2 rotate-45 mx-auto -mt-1" style={{ backgroundColor: p.bgColor }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Expanded card icon (used in Contact page) ── */
function ExpandedIcon({ p, size }: { p: any; size: "sm" | "md" | "lg" }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.a
      href={p.buildUrl(p.cfg.value)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow us on ${p.label}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      animate={{ scale: hov ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-2 p-2.5 rounded-xl transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]"
      style={{ backgroundColor: hov ? p.bgColor + "26" : "transparent" }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        animate={{ backgroundColor: hov ? p.bgColor + "30" : p.bgColor + "18" }}
        className={`${CIRCLE_MAP[size]} rounded-full flex items-center justify-center`}
      >
        <p.Icon size={SIZE_MAP[size]} style={{ color: p.color }} />
      </motion.div>
      <span className="text-[10px] font-medium text-background/60 transition-colors whitespace-nowrap">
        {p.label}
      </span>
    </motion.a>
  );
}

/* ── Footer card variant — the main premium layout ── */
function FooterCard({ p }: { p: any }) {
  const [hov, setHov] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 500);
  };

  const isLight = ["snapchat"].includes(p.key);
  const iconColor = isLight ? "#1A1A2E" : "#fff";

  return (
    <div
      className="relative"
      onMouseEnter={() => { setHov(true); tipTimer.current = setTimeout(() => setShowTip(true), 500); }}
      onMouseLeave={() => { setHov(false); setShowTip(false); clearTimeout(tipTimer.current); }}
    >
      <motion.a
        href={p.buildUrl(p.cfg.value)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow us on ${p.label}`}
        onClick={handleClick}
        animate={{
          y: hov ? -5 : 0,
          boxShadow: hov ? `0 12px 32px ${p.bgColor}70` : "0 2px 8px rgba(0,0,0,0.3)",
        }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A2E]"
        style={{
          background: p.gradientFrom && hov
            ? `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo ?? p.bgColor})`
            : hov ? p.bgColor : "rgba(255,255,255,0.06)",
          border: `1px solid ${hov ? p.bgColor + "80" : "rgba(255,255,255,0.10)"}`,
          minWidth: 72,
        }}
        whileTap={{ scale: 0.92 }}
      >
        {/* Background glow pulse */}
        <AnimatePresence>
          {hov && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.2, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: p.bgColor, filter: "blur(20px)" }}
            />
          )}
        </AnimatePresence>

        {/* Click ripple */}
        <AnimatePresence>
          {clicked && (
            <motion.span
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={{ scale: hov ? 1.15 : 1, rotate: hov ? [0, -8, 8, 0] : 0 }}
          transition={{ duration: 0.3, rotate: { duration: 0.4 } }}
          className="relative z-10"
        >
          <p.Icon size={24} style={{ color: hov ? iconColor : p.color }} />
        </motion.div>

        {/* Label */}
        <span
          className="relative z-10 text-[11px] font-semibold tracking-wide"
          style={{ color: hov ? iconColor : "rgba(255,255,255,0.65)" }}
        >
          {p.label}
        </span>
      </motion.a>

      {/* Tooltip */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.88 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
            role="tooltip"
          >
            <div
              className="text-white text-xs font-medium px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl"
              style={{ background: p.bgColor }}
            >
              Follow us on {p.label}
            </div>
            <div className="w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5" style={{ background: p.bgColor }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main export ── */
export default function SocialIconsBar({
  size = "md",
  direction = "row",
  showLabels = false,
  variant = "compact",
  data,
}: Props) {
  const active = useActivePlatforms(data);
  if (!active.length) return null;

  if (variant === "footer") {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {active.map(p => <FooterCard key={p.key} p={p} />)}
      </div>
    );
  }

  const eff = showLabels ? "expanded" : variant;
  return (
    <div className={`flex flex-wrap gap-2 ${direction === "col" ? "flex-col" : "flex-row"} items-center`}>
      {active.map(p =>
        eff === "expanded"
          ? <ExpandedIcon key={p.key} p={p} size={size} />
          : <CompactIcon key={p.key} p={p} size={size} />
      )}
    </div>
  );
}
