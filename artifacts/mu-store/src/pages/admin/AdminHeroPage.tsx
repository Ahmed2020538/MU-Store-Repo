import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { HeroConfig } from "@/components/HeroSection";

const DEFAULT: HeroConfig = {
  headlines: ["Walk in Luxury", "Crafted for Your Style", "Styled by AI"],
  subtext: "Handcrafted luxury shoes and bags, designed for the modern Egyptian woman who knows her worth.",
  badge: "Premium Egyptian Brand",
  primaryCta: { text: "Shop Now", link: "/products" },
  secondaryCta: { text: "Shop Bags", link: "/products?category=bags" },
  features: { aiStylist: true, tryOn: true, voiceShopping: true },
  socialProof: { count: 2400, rating: 4.9, label: "Egyptian women" },
  urgency: { enabled: true, message: "Limited Collection — New arrivals selling fast" },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-ring/50 transition-colors";

export default function AdminHeroPage() {
  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/hero")
      .then(r => r.json())
      .then(d => setCfg(c => ({ ...c, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("mu_token");
      const r = await fetch("/api/settings/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cfg),
      });
      if (r.ok) toast.success("Hero section saved!");
      else toast.error("Save failed");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const setH = (i: number, v: string) => setCfg(c => ({ ...c, headlines: c.headlines.map((h, j) => j === i ? v : h) }));
  const addH = () => setCfg(c => ({ ...c, headlines: [...c.headlines, "New Headline"] }));
  const delH = (i: number) => setCfg(c => ({ ...c, headlines: c.headlines.filter((_, j) => j !== i) }));

  if (loading) return <div className="text-sm text-muted-foreground py-4">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#C9A96E]" />
          <h2 className="font-semibold">Hero Section Control</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCfg(DEFAULT)}>
            <RotateCcw size={13} className="mr-1.5" /> Reset
          </Button>
          <Button size="sm" onClick={save} disabled={saving}
            className="bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#D4B87E] font-semibold">
            <Save size={13} className="mr-1.5" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Badge & Subtext */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold">Branding</p>
        <Field label="Badge text">
          <input className={inp} value={cfg.badge} onChange={e => setCfg(c => ({ ...c, badge: e.target.value }))} />
        </Field>
        <Field label="Subtext / description">
          <textarea className={inp} rows={3} value={cfg.subtext} onChange={e => setCfg(c => ({ ...c, subtext: e.target.value }))} />
        </Field>
      </div>

      {/* Rotating headlines */}
      <div className="border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Rotating Headlines</p>
          <Button size="sm" variant="outline" onClick={addH}><Plus size={13} className="mr-1" /> Add</Button>
        </div>
        {cfg.headlines.map((h, i) => (
          <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} className="flex gap-2">
            <input className={`${inp} flex-1`} value={h} onChange={e => setH(i, e.target.value)} />
            <Button size="icon" variant="ghost" onClick={() => delH(i)} disabled={cfg.headlines.length <= 1}
              className="text-destructive hover:bg-destructive/10 flex-shrink-0">
              <Trash2 size={13} />
            </Button>
          </motion.div>
        ))}
      </div>

      {/* CTAs */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold">Calls to Action</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Primary Button</p>
            <Field label="Text"><input className={inp} value={cfg.primaryCta.text} onChange={e => setCfg(c => ({ ...c, primaryCta: { ...c.primaryCta, text: e.target.value } }))} /></Field>
            <Field label="Link"><input className={inp} value={cfg.primaryCta.link} onChange={e => setCfg(c => ({ ...c, primaryCta: { ...c.primaryCta, link: e.target.value } }))} /></Field>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Secondary Button</p>
            <Field label="Text"><input className={inp} value={cfg.secondaryCta.text} onChange={e => setCfg(c => ({ ...c, secondaryCta: { ...c.secondaryCta, text: e.target.value } }))} /></Field>
            <Field label="Link"><input className={inp} value={cfg.secondaryCta.link} onChange={e => setCfg(c => ({ ...c, secondaryCta: { ...c.secondaryCta, link: e.target.value } }))} /></Field>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="border border-border rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold">AI Feature Buttons</p>
        {([
          ["aiStylist", "✨ Get Styled by AI"],
          ["tryOn", "📸 Try It On Instantly"],
          ["voiceShopping", "🎤 Speak to Shop"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm">{label}</span>
            <button type="button"
              onClick={() => setCfg(c => ({ ...c, features: { ...c.features, [key]: !c.features[key] } }))}
              className={`w-11 h-6 rounded-full transition-colors ${cfg.features[key] ? "bg-[#C9A96E]" : "bg-muted-foreground/25"} relative`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${cfg.features[key] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </label>
        ))}
      </div>

      {/* Social Proof */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold">Social Proof</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Customer count">
            <input type="number" className={inp} value={cfg.socialProof.count}
              onChange={e => setCfg(c => ({ ...c, socialProof: { ...c.socialProof, count: parseInt(e.target.value) || 0 } }))} />
          </Field>
          <Field label="Rating (0–5)">
            <input type="number" step="0.1" min="0" max="5" className={inp} value={cfg.socialProof.rating}
              onChange={e => setCfg(c => ({ ...c, socialProof: { ...c.socialProof, rating: parseFloat(e.target.value) || 0 } }))} />
          </Field>
          <Field label="Label">
            <input className={inp} value={cfg.socialProof.label}
              onChange={e => setCfg(c => ({ ...c, socialProof: { ...c.socialProof, label: e.target.value } }))} />
          </Field>
        </div>
      </div>

      {/* Urgency */}
      <div className="border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Urgency Banner</p>
          <button type="button"
            onClick={() => setCfg(c => ({ ...c, urgency: { ...c.urgency, enabled: !c.urgency.enabled } }))}
            className={`w-11 h-6 rounded-full transition-colors ${cfg.urgency.enabled ? "bg-[#C9A96E]" : "bg-muted-foreground/25"} relative`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${cfg.urgency.enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        {cfg.urgency.enabled && (
          <Field label="Message">
            <input className={inp} value={cfg.urgency.message}
              onChange={e => setCfg(c => ({ ...c, urgency: { ...c.urgency, message: e.target.value } }))} />
          </Field>
        )}
      </div>

      <Button onClick={save} disabled={saving} className="w-full bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#D4B87E] font-semibold">
        <Save size={14} className="mr-2" /> {saving ? "Saving…" : "Save All Changes"}
      </Button>
    </div>
  );
}
