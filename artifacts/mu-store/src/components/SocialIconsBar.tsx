import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SOCIAL_PLATFORMS } from "@/lib/social-config";

type Variant = "compact" | "expanded";

interface Props {
  size?: "sm" | "md" | "lg";
  direction?: "row" | "col";
  showLabels?: boolean;
  variant?: Variant;
  data?: Record<string, { active: boolean; value: string; order: number }>;
}

const SIZE_MAP = { sm: 16, md: 20, lg: 26 };
const CIRCLE_MAP = { sm: "w-9 h-9", md: "w-10 h-10", lg: "w-14 h-14" };

function CompactIcon({ p, size }: { p: any; size: "sm" | "md" | "lg" }) {
  const [hov, setHov] = useState(false);
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => { setHov(true); setShowTip(true); }} onMouseLeave={() => { setHov(false); setShowTip(false); }}>
      <motion.a
        href={p.buildUrl(p.cfg.value)} target="_blank" rel="noopener noreferrer" aria-label={p.label}
        animate={{ backgroundColor: hov ? p.bgColor : "#1A1A2E", scale: hov ? 1.1 : 1, y: hov ? -3 : 0 }}
        transition={{ duration: 0.22 }}
        className={`${CIRCLE_MAP[size]} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <p.Icon size={SIZE_MAP[size]} style={{ color: hov ? "#fff" : p.color }} />
      </motion.a>
      <AnimatePresence>
        {showTip && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1A1A2E] text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap border border-white/10 pointer-events-none z-50">
            {p.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpandedIcon({ p, size }: { p: any; size: "sm" | "md" | "lg" }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.a
      href={p.buildUrl(p.cfg.value)} target="_blank" rel="noopener noreferrer" aria-label={p.label}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      animate={{ scale: hov ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-2 p-2.5 rounded-xl transition-colors duration-200 cursor-pointer"
      style={{ backgroundColor: hov ? p.bgColor + "26" : "transparent" }}
    >
      <motion.div
        animate={{ backgroundColor: hov ? p.bgColor + "30" : p.bgColor + "18" }}
        className={`${CIRCLE_MAP[size]} rounded-full flex items-center justify-center`}
      >
        <p.Icon size={SIZE_MAP[size]} style={{ color: p.color }} />
      </motion.div>
      <span className="text-[10px] font-medium text-background/60 group-hover:text-background/90 transition-colors whitespace-nowrap">
        {p.label}
      </span>
    </motion.a>
  );
}

export default function SocialIconsBar({ size = "md", direction = "row", showLabels = false, variant = "compact", data }: Props) {
  const [social, setSocial] = useState<Record<string, any>>(data ?? {});

  useEffect(() => {
    if (data) return;
    const cached = sessionStorage.getItem("mu_social_v2");
    if (cached) { setSocial(JSON.parse(cached)); return; }
    fetch("/api/settings/social").then(r => r.json()).then(d => {
      setSocial(d);
      sessionStorage.setItem("mu_social_v2", JSON.stringify(d));
    }).catch(() => {});
  }, [data]);

  const active = SOCIAL_PLATFORMS
    .map(p => ({ ...p, cfg: social[p.key] }))
    .filter(p => p.cfg?.active && p.cfg?.value)
    .sort((a, b) => (a.cfg?.order ?? 99) - (b.cfg?.order ?? 99));

  if (!active.length) return null;

  const eff = showLabels ? "expanded" : variant;

  return (
    <div className={`flex flex-wrap gap-2 ${direction === "col" ? "flex-col" : "flex-row"} items-center`}>
      {active.map(p => eff === "expanded"
        ? <ExpandedIcon key={p.key} p={p} size={size} />
        : <CompactIcon key={p.key} p={p} size={size} />)}
    </div>
  );
}
