import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Share2, MessageCircle, Instagram, Facebook, Youtube, ChevronUp, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PLATFORM_ICONS: Record<string, any> = {
  WhatsApp: MessageCircle, Instagram, Facebook, YouTube: Youtube,
  TikTok: Share2, Pinterest: Share2, Snapchat: Share2, "X (Twitter)": Share2,
};

const PLATFORM_LIST = ["WhatsApp","Instagram","Facebook","TikTok","Pinterest","YouTube","Snapchat","X (Twitter)"];

const DEFAULT_SETTINGS = {
  phone1: "+20 100 000 0000", phone1Whatsapp: true, phone2: "",
  supportEmail: "support@mu-store.com",
  addressAr: "القاهرة، مصر", addressEn: "Cairo, Egypt",
  workingHours: "Sun–Thu: 10am–8pm", googleMapsUrl: "",
  socials: PLATFORM_LIST.map((p, i) => ({ platform: p, active: i < 3, url: "", order: i })),
  whatsappNumber: "+20 100 000 0000",
  whatsappMessage: "مرحباً، أريد الاستفسار عن منتج",
  whatsappButtonActive: true, whatsappButtonColor: "#25D366",
  codDownPayment: 50,
};

export default function AdminContactPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mu_token");
    Promise.all([
      fetch("/api/settings/contact", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/settings/cod-down-payment", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([contact, cod]) => {
      setSettings(prev => ({ ...DEFAULT_SETTINGS, ...contact, codDownPayment: cod.amount ?? 50 }));
    }).catch(() => {});
  }, []);

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));
  const updateSocial = (idx: number, key: string, value: any) => setSettings(prev => ({
    ...prev, socials: prev.socials.map((s, i) => i === idx ? { ...s, [key]: value } : s),
  }));
  const moveSocial = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= settings.socials.length) return;
    setSettings(prev => {
      const s = [...prev.socials];
      [s[idx], s[next]] = [s[next], s[idx]];
      return { ...prev, socials: s.map((x, i) => ({ ...x, order: i })) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("mu_token");
    try {
      await Promise.all([
        fetch("/api/settings/contact", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(settings) }),
        fetch("/api/settings/cod-down-payment", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: settings.codDownPayment }) }),
      ]);
      toast.success("Settings saved");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold">Contact & Settings</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-[#C9A96E] text-foreground hover:opacity-90" data-testid="button-save-settings">
          <Save size={16} className="mr-2" />{saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Panel A — Contact Info */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Phone size={16} className="text-[#C9A96E]" /> Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Phone 1</Label>
            <Input value={settings.phone1} onChange={e => update("phone1", e.target.value)} data-testid="input-phone1" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1.5"><Switch checked={settings.phone1Whatsapp} onCheckedChange={v => update("phone1Whatsapp", v)} /><Label>WhatsApp enabled</Label></div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone 2 (optional)</Label>
            <Input value={settings.phone2} onChange={e => update("phone2", e.target.value)} data-testid="input-phone2" />
          </div>
          <div className="space-y-1.5">
            <Label>Support Email</Label>
            <Input value={settings.supportEmail} onChange={e => update("supportEmail", e.target.value)} data-testid="input-email" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (Arabic)</Label>
            <Input value={settings.addressAr} onChange={e => update("addressAr", e.target.value)} dir="rtl" data-testid="input-address-ar" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (English)</Label>
            <Input value={settings.addressEn} onChange={e => update("addressEn", e.target.value)} data-testid="input-address-en" />
          </div>
          <div className="space-y-1.5">
            <Label>Working Hours</Label>
            <Input value={settings.workingHours} onChange={e => update("workingHours", e.target.value)} data-testid="input-hours" />
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps Embed URL</Label>
            <Input value={settings.googleMapsUrl} onChange={e => update("googleMapsUrl", e.target.value)} data-testid="input-maps" />
          </div>
        </div>
      </div>

      {/* Panel B — Socials */}
      <div className="border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Share2 size={16} className="text-[#C9A96E]" /> Social Media</h3>
        {settings.socials.map((s, idx) => {
          const Icon = PLATFORM_ICONS[s.platform] ?? Share2;
          return (
            <div key={s.platform} className="flex items-center gap-3 py-2 border-b border-border last:border-0" data-testid={`social-row-${s.platform.toLowerCase()}`}>
              <Icon size={18} className="text-muted-foreground flex-shrink-0 w-5" />
              <Switch checked={s.active} onCheckedChange={v => updateSocial(idx, "active", v)} />
              <span className="text-sm font-medium w-24 flex-shrink-0">{s.platform}</span>
              <Input value={s.url} onChange={e => updateSocial(idx, "url", e.target.value)} placeholder="URL or phone number" className="flex-1 text-sm h-8" />
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveSocial(idx, -1)} className="p-0.5 hover:bg-muted rounded" disabled={idx === 0}><ChevronUp size={14} /></button>
                <button type="button" onClick={() => moveSocial(idx, 1)} className="p-0.5 hover:bg-muted rounded" disabled={idx === settings.socials.length - 1}><ChevronDown size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel C — WhatsApp */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><MessageCircle size={16} className="text-[#C9A96E]" /> WhatsApp Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input value={settings.whatsappNumber} onChange={e => update("whatsappNumber", e.target.value)} data-testid="input-whatsapp" />
          </div>
          <div className="space-y-1.5">
            <Label>Button Color</Label>
            <div className="flex gap-2">
              <input type="color" value={settings.whatsappButtonColor} onChange={e => update("whatsappButtonColor", e.target.value)} className="h-9 w-14 rounded border border-border cursor-pointer" />
              <Input value={settings.whatsappButtonColor} onChange={e => update("whatsappButtonColor", e.target.value)} className="flex-1" />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Auto-message Template</Label>
            <Input value={settings.whatsappMessage} onChange={e => update("whatsappMessage", e.target.value)} dir="rtl" data-testid="input-wa-message" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={settings.whatsappButtonActive} onCheckedChange={v => update("whatsappButtonActive", v)} />
            <Label>Show floating button</Label>
          </div>
        </div>
      </div>

      {/* COD Down Payment */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Cash on Delivery — Down Payment</h3>
        <div className="space-y-1.5 max-w-xs">
          <Label>Down Payment Amount (EGP)</Label>
          <Input type="number" value={settings.codDownPayment} onChange={e => update("codDownPayment", parseInt(e.target.value) || 0)} min={0} data-testid="input-cod-amount" />
          <p className="text-xs text-muted-foreground">This amount is required online when customer selects Cash on Delivery</p>
        </div>
      </div>
    </div>
  );
}
