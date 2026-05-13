import { useState, useEffect } from "react";
import { Phone, MessageCircle, Server, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  phone1: "+20 100 000 0000", phone1Whatsapp: true, phone2: "",
  supportEmail: "support@mu-store.com",
  addressAr: "القاهرة، مصر", addressEn: "Cairo, Egypt",
  workingHours: "Sun–Thu: 10am–8pm", googleMapsUrl: "",
  whatsappNumber: "+20 100 000 0000",
  whatsappMessage: "مرحباً، أريد الاستفسار عن منتج",
  whatsappButtonActive: true, whatsappButtonColor: "#25D366",
  codDownPayment: 50,
};

const DEFAULT_SMTP = {
  enabled: false, host: "smtp.gmail.com", port: 587,
  secure: false, user: "", pass: "",
  fromName: "MU Store", fromEmail: "noreply@mu-store.com",
};

export default function AdminContactPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [smtp, setSmtp] = useState(DEFAULT_SMTP);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mu_token");
    Promise.all([
      fetch("/api/settings/contact", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/settings/cod-down-payment", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/settings/smtp", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([contact, cod, smtpCfg]) => {
      setSettings(prev => ({ ...DEFAULT_SETTINGS, ...contact, codDownPayment: cod.amount ?? 50 }));
      setSmtp(prev => ({ ...DEFAULT_SMTP, ...smtpCfg }));
    }).catch(() => {});
  }, []);

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));
  const updateSmtp = (key: string, value: any) => setSmtp(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("mu_token");
    try {
      await Promise.all([
        fetch("/api/settings/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(settings),
        }),
        fetch("/api/settings/cod-down-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: settings.codDownPayment }),
        }),
        fetch("/api/settings/smtp", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(smtp),
        }),
      ]);
      toast.success("Settings saved");
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) { toast.error("Enter an email address to test"); return; }
    setSendingTest(true);
    const token = localStorage.getItem("mu_token");
    try {
      const res = await fetch("/api/settings/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: testEmail }),
      });
      if (res.ok) { toast.success(`Test email sent to ${testEmail}`); }
      else { const d = await res.json(); toast.error(d.error ?? "Send failed"); }
    } catch {
      toast.error("Request failed");
    }
    setSendingTest(false);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold">Contact & Settings</h2>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#C9A96E] text-foreground hover:opacity-90 rounded-xl"
          data-testid="button-save-settings"
        >
          <Save size={15} className="mr-2" />
          {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      {/* Contact Info */}
      <div className="border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Phone size={16} className="text-[#C9A96E]" /> Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Phone 1</Label>
            <Input value={settings.phone1} onChange={e => update("phone1", e.target.value)} data-testid="input-phone1" className="rounded-xl" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={settings.phone1Whatsapp} onCheckedChange={v => update("phone1Whatsapp", v)} />
            <Label>WhatsApp enabled</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Phone 2 (optional)</Label>
            <Input value={settings.phone2} onChange={e => update("phone2", e.target.value)} data-testid="input-phone2" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Support Email</Label>
            <Input value={settings.supportEmail} onChange={e => update("supportEmail", e.target.value)} data-testid="input-email" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (Arabic)</Label>
            <Input value={settings.addressAr} onChange={e => update("addressAr", e.target.value)} dir="rtl" data-testid="input-address-ar" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (English)</Label>
            <Input value={settings.addressEn} onChange={e => update("addressEn", e.target.value)} data-testid="input-address-en" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Working Hours</Label>
            <Input value={settings.workingHours} onChange={e => update("workingHours", e.target.value)} data-testid="input-hours" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps Embed URL</Label>
            <Input value={settings.googleMapsUrl} onChange={e => update("googleMapsUrl", e.target.value)} data-testid="input-maps" className="rounded-xl" />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle size={16} className="text-[#C9A96E]" /> WhatsApp Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input value={settings.whatsappNumber} onChange={e => update("whatsappNumber", e.target.value)} data-testid="input-whatsapp" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Button Color</Label>
            <div className="flex gap-2">
              <input type="color" value={settings.whatsappButtonColor} onChange={e => update("whatsappButtonColor", e.target.value)} className="h-9 w-14 rounded-xl border border-border cursor-pointer" />
              <Input value={settings.whatsappButtonColor} onChange={e => update("whatsappButtonColor", e.target.value)} className="flex-1 rounded-xl" />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Auto-message Template</Label>
            <Input value={settings.whatsappMessage} onChange={e => update("whatsappMessage", e.target.value)} dir="rtl" data-testid="input-wa-message" className="rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={settings.whatsappButtonActive} onCheckedChange={v => update("whatsappButtonActive", v)} />
            <Label>Show floating button</Label>
          </div>
        </div>
      </div>

      {/* COD Down Payment */}
      <div className="border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold">Cash on Delivery — Down Payment</h3>
        <div className="space-y-1.5 max-w-xs">
          <Label>Down Payment Amount (EGP)</Label>
          <Input type="number" value={settings.codDownPayment} onChange={e => update("codDownPayment", parseInt(e.target.value) || 0)} min={0} data-testid="input-cod-amount" className="rounded-xl" />
          <p className="text-xs text-muted-foreground">Required online when customer selects Cash on Delivery</p>
        </div>
      </div>

      {/* SMTP */}
      <div className="border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Server size={16} className="text-[#C9A96E]" /> Email / SMTP Settings
          </h3>
          <div className="flex items-center gap-2">
            <Switch checked={smtp.enabled} onCheckedChange={v => updateSmtp("enabled", v)} data-testid="switch-smtp-enabled" />
            <Label className="text-sm">{smtp.enabled ? "Enabled" : "Disabled"}</Label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          When enabled, customers receive a branded order confirmation email automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>SMTP Host</Label>
            <Input value={smtp.host} onChange={e => updateSmtp("host", e.target.value)} placeholder="smtp.gmail.com" data-testid="input-smtp-host" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Port</Label>
            <Input type="number" value={smtp.port} onChange={e => updateSmtp("port", parseInt(e.target.value) || 587)} data-testid="input-smtp-port" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Username / Email</Label>
            <Input value={smtp.user} onChange={e => updateSmtp("user", e.target.value)} placeholder="your@gmail.com" data-testid="input-smtp-user" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Password / App Password</Label>
            <Input type="password" value={smtp.pass} onChange={e => updateSmtp("pass", e.target.value)} placeholder="App password" data-testid="input-smtp-pass" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>From Name</Label>
            <Input value={smtp.fromName} onChange={e => updateSmtp("fromName", e.target.value)} data-testid="input-smtp-from-name" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>From Email</Label>
            <Input value={smtp.fromEmail} onChange={e => updateSmtp("fromEmail", e.target.value)} data-testid="input-smtp-from-email" className="rounded-xl" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={smtp.secure} onCheckedChange={v => updateSmtp("secure", v)} />
            <Label className="text-sm">Use SSL/TLS (port 465)</Label>
          </div>
        </div>
        <div className="border-t border-border pt-4 space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Send size={13} /> Test Email
          </Label>
          <div className="flex gap-2 max-w-sm">
            <Input
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 text-sm rounded-xl"
              data-testid="input-test-email"
            />
            <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={sendingTest} className="rounded-xl" data-testid="button-send-test">
              {sendingTest ? "Sending…" : "Send Test"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Save settings first, then send a test to verify your SMTP config.</p>
        </div>
      </div>
    </div>
  );
}
