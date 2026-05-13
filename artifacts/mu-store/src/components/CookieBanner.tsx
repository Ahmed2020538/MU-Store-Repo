import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield, BarChart2, Megaphone } from "lucide-react";
import { hasConsented, setConsent } from "@/lib/cookie-consent";
import { Button } from "@/components/ui/button";

type Prefs = { analytics: boolean; marketing: boolean };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? "bg-foreground" : "bg-muted-foreground/30"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !hasConsented());
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ analytics: true, marketing: true });

  if (!visible) return null;

  const save = (type: "all" | "essential" | "custom") => {
    setConsent({
      essential: true,
      analytics: type === "all" ? true : type === "essential" ? false : prefs.analytics,
      marketing: type === "all" ? true : type === "essential" ? false : prefs.marketing,
    });
    setVisible(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="cookie-banner"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed bottom-4 left-4 right-4 z-[200] max-w-4xl mx-auto"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {!showSettings ? (
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                <Cookie size={20} className="text-[#C9A96E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-0.5">We value your privacy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies to enhance your browsing experience, personalize content, and analyze traffic. Choose your preferences below.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button onClick={() => save("essential")} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  Reject All
                </button>
                <Button onClick={() => setShowSettings(true)} variant="outline" size="sm" className="rounded-xl text-xs h-8">
                  Manage
                </Button>
                <Button onClick={() => save("all")} size="sm" className="rounded-xl text-xs h-8 bg-foreground text-background hover:opacity-90">
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Cookie Preferences</p>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2.5">
                    <Shield size={15} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Essential</p>
                      <p className="text-xs text-muted-foreground">Required for the site to work. Cannot be disabled.</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-semibold">Always On</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2.5">
                    <BarChart2 size={15} className="text-[#C9A96E] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">Helps us understand how you use our site.</p>
                    </div>
                  </div>
                  <Toggle on={prefs.analytics} onChange={v => setPrefs(p => ({ ...p, analytics: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2.5">
                    <Megaphone size={15} className="text-[#C9A96E] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Marketing</p>
                      <p className="text-xs text-muted-foreground">Allows us to show you personalized content and ads.</p>
                    </div>
                  </div>
                  <Toggle on={prefs.marketing} onChange={v => setPrefs(p => ({ ...p, marketing: v }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => save("essential")} variant="outline" size="sm" className="flex-1 rounded-xl h-9">
                  Essential Only
                </Button>
                <Button onClick={() => save("custom")} size="sm" className="flex-1 rounded-xl h-9 bg-foreground text-background hover:opacity-90">
                  Save My Choices
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
