import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Save, Eye, EyeOff, CheckCircle, AlertCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SOCIAL_PLATFORMS } from "@/lib/social-config";
import SocialIconsBar from "@/components/SocialIconsBar";

type SocialEntry = { active: boolean; value: string; order: number };
type SocialState = Record<string, SocialEntry>;

function isValidUrl(val: string, key: string): boolean {
  if (!val) return true;
  if (key === "whatsapp") return /^\+?[\d\s\-()]{7,20}$/.test(val.trim());
  try { new URL(val.startsWith("http") ? val : `https://${val}`); return true; }
  catch { return false; }
}

function buildPreviewData(state: SocialState): Record<string, any> {
  return Object.fromEntries(
    Object.entries(state).map(([k, v]) => [k, { active: v.active, value: v.value, order: v.order }])
  );
}

export default function AdminSocialPage() {
  const [state, setState] = useState<SocialState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mu_token");
    fetch("/api/settings/social", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const merged: SocialState = {};
        SOCIAL_PLATFORMS.forEach((p, i) => {
          merged[p.key] = {
            active: data[p.key]?.active ?? false,
            value: data[p.key]?.value ?? "",
            order: data[p.key]?.order ?? (i + 1),
          };
        });
        setState(merged);
      })
      .catch(() => {
        const init: SocialState = {};
        SOCIAL_PLATFORMS.forEach((p, i) => { init[p.key] = { active: false, value: "", order: i + 1 }; });
        setState(init);
      })
      .finally(() => setLoading(false));
  }, []);

  const ordered = SOCIAL_PLATFORMS
    .map(p => ({ ...p, entry: state[p.key] ?? { active: false, value: "", order: 99 } }))
    .sort((a, b) => a.entry.order - b.entry.order);

  const update = useCallback((key: string, field: keyof SocialEntry, value: any) => {
    setState(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setDirty(true);
  }, []);

  const move = (key: string, dir: -1 | 1) => {
    const keys = ordered.map(p => p.key);
    const idx = keys.indexOf(key);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= keys.length) return;
    const swapKey = keys[nextIdx];
    setState(prev => {
      const a = prev[key].order;
      const b = prev[swapKey].order;
      return { ...prev, [key]: { ...prev[key], order: b }, [swapKey]: { ...prev[swapKey], order: a } };
    });
    setDirty(true);
  };

  const handleSave = async () => {
    const hasErrors = SOCIAL_PLATFORMS.some(p => state[p.key]?.active && !isValidUrl(state[p.key]?.value, p.key));
    if (hasErrors) { toast.error("Fix URL errors before saving"); return; }
    setSaving(true);
    const token = localStorage.getItem("mu_token");
    try {
      await fetch("/api/settings/social", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(state),
      });
      sessionStorage.removeItem("mu_social_v2");
      setDirty(false);
      toast.success("Social media settings saved — frontend updated");
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const activeCount = Object.values(state).filter(v => v.active && v.value).length;

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Share2 size={22} className="text-[#C9A96E]" />
            Social Media Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} platform{activeCount !== 1 ? "s" : ""} active — changes reflect instantly on the frontend
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(v => !v)} className="rounded-xl gap-1.5">
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="bg-[#C9A96E] text-[#1A1A2E] hover:opacity-90 rounded-xl font-semibold gap-2"
            data-testid="button-save-social"
          >
            <Save size={15} />
            {saving ? "Saving…" : dirty ? "Save Changes" : "Saved ✓"}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1 max-w-2xl"}`}>
        {/* Platform List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
            Platforms — drag to reorder
          </p>
          <AnimatePresence mode="popLayout">
            {ordered.map((p, idx) => {
              const entry = p.entry;
              const urlError = entry.active && entry.value && !isValidUrl(entry.value, p.key);
              const isLight = ["snapchat"].includes(p.key);

              return (
                <motion.div
                  key={p.key}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  data-testid={`social-row-${p.key}`}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                    entry.active
                      ? "border-border bg-card shadow-sm hover:shadow-md"
                      : "border-transparent bg-muted/30 opacity-60 hover:opacity-80"
                  }`}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => move(p.key, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-25"
                      aria-label={`Move ${p.label} up`}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(p.key, 1)}
                      disabled={idx === ordered.length - 1}
                      className="p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-25"
                      aria-label={`Move ${p.label} down`}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Brand icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: p.gradientFrom ? `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo ?? p.bgColor})` : p.bgColor }}
                  >
                    <p.Icon size={18} style={{ color: isLight ? "#1A1A2E" : "#fff" }} />
                  </div>

                  {/* Label */}
                  <span className="text-sm font-semibold w-24 flex-shrink-0">{p.label}</span>

                  {/* URL input */}
                  <div className="flex-1 relative">
                    <Input
                      value={entry.value}
                      onChange={e => update(p.key, "value", e.target.value)}
                      placeholder={p.key === "whatsapp" ? "+20 100 000 0000" : `${p.label.toLowerCase()} URL or handle`}
                      className={`h-9 text-sm pr-8 rounded-xl ${urlError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      data-testid={`input-social-${p.key}`}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {entry.value && (
                        urlError
                          ? <AlertCircle size={14} className="text-destructive" />
                          : <CheckCircle size={14} className="text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={entry.active}
                      onCheckedChange={v => update(p.key, "active", v)}
                      data-testid={`toggle-social-${p.key}`}
                      aria-label={`${entry.active ? "Disable" : "Enable"} ${p.label}`}
                    />
                    <Label className="text-xs text-muted-foreground w-12">
                      {entry.active ? "Live" : "Off"}
                    </Label>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground pt-2 px-1">
            For WhatsApp enter phone number (e.g. +201001234567). For all others, enter full URL or just the handle/username.
          </p>
        </div>

        {/* Live Preview Panel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="lg:sticky lg:top-24 self-start"
            >
              <div className="rounded-2xl border border-border overflow-hidden shadow-lg">
                {/* Preview header */}
                <div className="bg-muted/60 px-4 py-3 border-b border-border flex items-center gap-2">
                  <Eye size={14} className="text-muted-foreground" />
                  <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Live Preview</span>
                  <span className="ml-auto text-xs text-muted-foreground">{activeCount} active</span>
                </div>

                {/* Dark footer simulation */}
                <div className="bg-[#1A1A2E] p-6">
                  <div className="text-center mb-6">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A96E] font-medium mb-1.5">
                      Stay Connected
                    </p>
                    <h3 className="font-serif text-xl font-bold text-white">Follow Us</h3>
                    <p className="text-[11px] text-white/40 mt-1">Join our community</p>
                  </div>

                  {activeCount > 0 ? (
                    <SocialIconsBar
                      variant="footer"
                      data={buildPreviewData(state)}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-white/30 italic">No active platforms</p>
                      <p className="text-[10px] text-white/20 mt-1">Enable at least one platform above</p>
                    </div>
                  )}
                </div>

                {/* Light context simulation */}
                <div className="bg-background p-4 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-3 font-semibold tracking-wide uppercase">Compact style</p>
                  {activeCount > 0 ? (
                    <SocialIconsBar
                      variant="compact"
                      size="sm"
                      data={buildPreviewData(state)}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nothing to show</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30">
                <p className="text-xs text-[#C9A96E] font-semibold mb-1">How it works</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Enable toggle + add URL → appears on frontend</li>
                  <li>• Reorder with ↑ ↓ arrows → controls display order</li>
                  <li>• Save → live on site within seconds</li>
                  <li>• 0 active platforms → "Follow Us" section hidden</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
