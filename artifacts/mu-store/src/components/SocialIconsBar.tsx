import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SOCIAL_PLATFORMS, SOCIAL_MAP } from "@/lib/social-config";

interface Props {
  size?: "sm" | "md" | "lg";
  direction?: "row" | "col";
  showLabels?: boolean;
  /** Pass pre-loaded social data to skip fetch */
  data?: Record<string, { active: boolean; value: string; order: number }>;
}

const SIZE_MAP = { sm: 16, md: 20, lg: 26 };
const CIRCLE_MAP = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14" };

export default function SocialIconsBar({ size = "md", direction = "row", showLabels = false, data }: Props) {
  const [social, setSocial] = useState<Record<string, any>>(data ?? {});

  useEffect(() => {
    if (data) return;
    fetch("/api/settings/social").then(r => r.json()).then(setSocial).catch(() => {});
  }, [data]);

  const active = SOCIAL_PLATFORMS
    .map(p => ({ ...p, cfg: social[p.key] }))
    .filter(p => p.cfg?.active && p.cfg?.value)
    .sort((a, b) => (a.cfg?.order ?? 99) - (b.cfg?.order ?? 99));

  if (!active.length) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${direction === "col" ? "flex-col" : "flex-row"} items-center`}>
      {active.map(({ key, label, Icon, bgColor, buildUrl, cfg }) => (
        <motion.a
          key={key}
          href={buildUrl(cfg.value)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`${CIRCLE_MAP[size]} rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${showLabels ? "gap-2 !rounded-xl px-3 w-auto" : ""}`}
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={SIZE_MAP[size]} style={{ color: "#fff" }} />
          {showLabels && <span className="text-white text-sm font-medium">{label}</span>}
        </motion.a>
      ))}
    </div>
  );
}
