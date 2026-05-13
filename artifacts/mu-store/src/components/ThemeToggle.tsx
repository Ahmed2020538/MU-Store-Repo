import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme-context";

const OPTIONS: { mode: ThemeMode; Icon: typeof Sun; label: string; desc: string }[] = [
  { mode: "light", Icon: Sun, label: "Light", desc: "Always use light mode" },
  { mode: "dark", Icon: Moon, label: "Dark", desc: "Easier on the eyes at night" },
  { mode: "system", Icon: Monitor, label: "System", desc: "Follow device preference" },
];

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [clicking, setClicking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isDark = resolvedTheme === "dark";

  const handleMouseEnter = () => {
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), 700);
  };
  const handleMouseLeave = () => {
    clearTimeout(tooltipTimer.current);
    setShowTooltip(false);
  };

  const handleClick = () => {
    setClicking(true);
    setShowTooltip(false);
    toggleTheme();
    setTimeout(() => setClicking(false), 400);
  };

  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleLongPressStart = () => { longPressTimer.current = setTimeout(() => setMenuOpen(true), 500); };
  const handleLongPressEnd = () => clearTimeout(longPressTimer.current);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const tooltipText = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";

  return (
    <div ref={menuRef} className="relative">
      {/* Main toggle button */}
      <motion.button
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(o => !o); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => { handleMouseLeave(); handleLongPressEnd(); }}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        aria-label={tooltipText}
        aria-pressed={isDark}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        whileTap={{ scale: 0.88 }}
      >
        {/* Ripple on click */}
        <AnimatePresence>
          {clicking && (
            <motion.span
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 rounded-lg bg-[#C9A96E]/30 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Icon swap */}
        <AnimatePresence mode="wait">
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: isDark ? -90 : 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: isDark ? 90 : -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center justify-center"
          >
            {isDark
              ? <Moon size={15} className="text-[#C9A96E]" />
              : <Sun size={15} className="text-foreground" />
            }
          </motion.span>
        </AnimatePresence>

        {/* System badge */}
        {theme === "system" && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#C9A96E] border-2 border-background" />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[200] whitespace-nowrap"
            role="tooltip"
          >
            <div className="bg-foreground text-background text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg">
              {tooltipText}
              <br />
              <span className="text-background/60 text-[10px]">Right-click for more options</span>
            </div>
            <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-[200] overflow-hidden"
          >
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {OPTIONS.map(({ mode, Icon, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => { setTheme(mode); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    theme === mode
                      ? "bg-[#C9A96E]/10 text-[#C9A96E]"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  {theme === mode && <Check size={13} className="flex-shrink-0 text-[#C9A96E]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
