import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SocialIconsBar from "@/components/SocialIconsBar";
import { SOCIAL_PLATFORMS } from "@/lib/social-config";

export default function ContactPage() {
  const [settings, setSettings] = useState<any>({});
  const [social, setSocial] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState("");

  useEffect(() => {
    fetch("/api/settings/contact").then(r => r.json()).then(setSettings).catch(() => {});
    fetch("/api/settings/social").then(r => r.json()).then(setSocial).catch(() => {});
  }, []);

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) { toast.error("يرجى ملء جميع الحقول المطلوبة"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(data.trackingRef);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else { toast.error(data.error ?? "حدث خطأ"); }
    } catch { toast.error("Request failed"); }
    setSubmitting(false);
  };

  const whatsappNum = (settings.whatsappNumber ?? social.whatsapp?.value ?? "+20100000000").replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(settings.whatsappMessage ?? "مرحباً، أريد الاستفسار عن منتج");
  const activeSocials = SOCIAL_PLATFORMS.filter(p => social[p.key]?.active && social[p.key]?.value)
    .sort((a, b) => (social[a.key]?.order ?? 99) - (social[b.key]?.order ?? 99));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold mb-3">تواصلي معنا</h1>
        <p className="text-muted-foreground text-lg">يسعدنا مساعدتك في أي وقت</p>
      </div>

      {/* Section 1: Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Phone, label: "الهاتف", value: settings.phone1, href: `tel:${settings.phone1}` },
          { icon: Mail, label: "البريد الإلكتروني", value: settings.supportEmail, href: `mailto:${settings.supportEmail}` },
          { icon: MapPin, label: "العنوان", value: settings.addressAr, href: settings.googleMapsUrl || undefined },
          { icon: Clock, label: "أوقات العمل", value: settings.workingHours, href: undefined },
        ].map(({ icon: Icon, label, value, href }) => value ? (
          <motion.a key={label} href={href} target={href?.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer" whileHover={{ y: -3 }}
            className={`border border-border rounded-xl p-5 text-center space-y-2 ${href ? "hover:border-[#C9A96E] cursor-pointer" : ""} transition-colors`}>
            <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto">
              <Icon size={18} className="text-[#C9A96E]" />
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm leading-tight" dir="rtl">{value}</p>
          </motion.a>
        ) : null)}
      </div>

      {/* Section 2: Social media */}
      {activeSocials.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-center">تابعينا على السوشيال ميديا</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {activeSocials.map(({ key, label, Icon, bgColor, buildUrl }) => {
              const cfg = social[key];
              return (
                <motion.a key={key} href={buildUrl(cfg.value)} target="_blank" rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="border border-border rounded-xl p-5 flex flex-col items-center gap-3 hover:border-transparent transition-all shadow-sm hover:shadow-md"
                  style={{ borderColor: bgColor + "40" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: bgColor }}>
                    <Icon size={26} style={{ color: "#fff" }} />
                  </div>
                  <p className="font-semibold text-sm">{label}</p>
                  <Button size="sm" className="text-white text-xs h-7 px-3 rounded-full" style={{ backgroundColor: bgColor }}>
                    تابعينا
                  </Button>
                </motion.a>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Contact form */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold">أرسلي رسالة</h2>
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">تم إرسال رسالتك!</h3>
              <p className="text-muted-foreground text-sm">رقم التتبع: <code className="bg-muted px-2 py-0.5 rounded text-xs">{submitted}</code></p>
              <p className="text-xs text-muted-foreground">سيصلك رد على بريدك الإلكتروني قريباً</p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted("")}>إرسال رسالة أخرى</Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الاسم <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => u("name", e.target.value)} placeholder="اسمك" data-testid="input-contact-name" />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.email} onChange={e => u("email", e.target.value)} placeholder="your@email.com" data-testid="input-contact-email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>الهاتف (اختياري)</Label>
                <Input value={form.phone} onChange={e => u("phone", e.target.value)} placeholder="+20 1XX XXX XXXX" data-testid="input-contact-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>الموضوع <span className="text-destructive">*</span></Label>
                <Input value={form.subject} onChange={e => u("subject", e.target.value)} placeholder="موضوع رسالتك" data-testid="input-contact-subject" />
              </div>
              <div className="space-y-1.5">
                <Label>الرسالة <span className="text-destructive">*</span></Label>
                <textarea value={form.message} onChange={e => u("message", e.target.value)} rows={5}
                  placeholder="اكتبي رسالتك هنا…"
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="textarea-contact-message" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-foreground text-background hover:opacity-90 h-11" data-testid="button-contact-submit">
                <Send size={16} className="ml-2" />{submitting ? "جاري الإرسال…" : "إرسال الرسالة"}
              </Button>
            </form>
          )}
        </div>

        {/* Section 4: WhatsApp CTA */}
        <div className="space-y-6">
          {settings.whatsappButtonActive !== false && (
            <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h3 className="font-bold text-lg">تواصلي عبر واتساب</h3>
              <p className="text-sm text-muted-foreground" dir="rtl">{settings.workingHours ?? "متاحون للمساعدة"}</p>
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 h-11" data-testid="button-whatsapp-contact">
                <a href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} className="mr-2" />ابدأي محادثة الآن
                </a>
              </Button>
            </div>
          )}
          {/* Store social bar */}
          <div className="border border-border rounded-xl p-6 text-center space-y-4">
            <h3 className="font-bold">تابعينا</h3>
            <div className="flex justify-center">
              <SocialIconsBar size="md" direction="row" data={social} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Google Maps */}
      {settings.googleMapsUrl && (
        <div className="rounded-xl overflow-hidden border border-border h-72">
          <iframe src={settings.googleMapsUrl} width="100%" height="100%" loading="lazy" style={{ border: 0 }} allowFullScreen title="MU Store Location" />
        </div>
      )}
    </div>
  );
}
