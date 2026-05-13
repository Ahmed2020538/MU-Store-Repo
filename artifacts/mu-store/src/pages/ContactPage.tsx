import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SocialIconsBar from "@/components/SocialIconsBar";
import { SOCIAL_PLATFORMS } from "@/lib/social-config";

const ALL_FAQS = [
  { keywords: ["size", "fit", "large", "small", "shoe"], q: "How do I find my size?", a: "Use our interactive Size Guide — enter your foot length and we'll recommend your EU size instantly.", link: "/size-guide", linkLabel: "Open Size Guide" },
  { keywords: ["return", "refund", "exchange", "swap", "back"], q: "How do I return an item?", a: "Returns are free within 14 days for unused items. Start your return from the Returns page or contact us on WhatsApp.", link: "/returns", linkLabel: "Go to Returns" },
  { keywords: ["shipping", "delivery", "when", "arrive", "track"], q: "When will my order arrive?", a: "Cairo & Giza: 1–2 business days. All other governorates: 3–5 business days. Check our Shipping Policy for details.", link: "/shipping", linkLabel: "Shipping Policy" },
  { keywords: ["promo", "discount", "coupon", "code", "offer"], q: "Do you have discount codes?", a: "Use MU20 for 20% off, WELCOME10 for 10% off your first order, or FREESHIP for free shipping on any order." },
  { keywords: ["order", "cancel", "change", "modify"], q: "Can I change or cancel my order?", a: "You can cancel or modify an order within 2 hours of placing it. Contact us immediately on WhatsApp." },
  { keywords: ["payment", "pay", "card", "fawry", "cash"], q: "What payment methods do you accept?", a: "We accept Credit/Debit cards, Fawry, Vodafone Cash, and Cash on Delivery (20 EGP fee)." },
];

const SUBJECTS = ["Order inquiry", "Size & fit help", "Returns & exchanges", "Shipping & delivery", "Product question", "Other"];

function SmartFAQ({ subject, message }: { subject: string; message: string }) {
  const text = (subject + " " + message).toLowerCase();
  const matched = ALL_FAQS.filter(faq => faq.keywords.some(kw => text.includes(kw)));
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!matched.length || (!subject && !message)) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-[#C9A96E]/30 bg-[#C9A96E]/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#C9A96E]">
          <Lightbulb size={15} />
          <span>Suggested answers based on your query</span>
        </div>
        {matched.map((faq, i) => (
          <div key={i} className="border border-border/60 rounded-lg bg-background overflow-hidden">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">{faq.q}</span>
              {openIdx === i ? <ChevronUp size={14} className="flex-shrink-0 text-muted-foreground" /> : <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                    {faq.link && <a href={faq.link} className="inline-flex items-center text-xs font-medium text-[#C9A96E] hover:underline">{faq.linkLabel} →</a>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Can't find the answer? Fill the form below and we'll respond within 2 hours.</p>
      </motion.div>
    </AnimatePresence>
  );
}

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
    if (!form.name || !form.email || !form.subject || !form.message) { toast.error("Please fill in all required fields"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setSubmitted(data.trackingRef); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }
      else { toast.error(data.error ?? "Something went wrong"); }
    } catch { toast.error("Request failed"); }
    setSubmitting(false);
  };

  const whatsappNum = (settings.whatsappNumber ?? social.whatsapp?.value ?? "+20100000000").replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(settings.whatsappMessage ?? "Hi, I'd like to ask about a product");
  const activeSocials = SOCIAL_PLATFORMS.filter(p => social[p.key]?.active && social[p.key]?.value).sort((a, b) => (social[a.key]?.order ?? 99) - (social[b.key]?.order ?? 99));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-muted-foreground text-lg">We're here to help — usually respond within 2 hours</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Phone, label: "Phone", value: settings.phone1, href: `tel:${settings.phone1}` },
          { icon: Mail, label: "Email", value: settings.supportEmail, href: `mailto:${settings.supportEmail}` },
          { icon: MapPin, label: "Address", value: settings.addressAr, href: settings.googleMapsUrl || undefined },
          { icon: Clock, label: "Working Hours", value: settings.workingHours, href: undefined },
        ].map(({ icon: Icon, label, value, href }) => value ? (
          <motion.a key={label} href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
            whileHover={{ y: -3 }} className={`border border-border rounded-xl p-5 text-center space-y-2 ${href ? "hover:border-[#C9A96E] cursor-pointer" : ""} transition-colors`}>
            <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto"><Icon size={18} className="text-[#C9A96E]" /></div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm leading-tight">{value}</p>
          </motion.a>
        ) : null)}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { emoji: "📏", title: "Need your size?", desc: "Interactive size finder with recommendations", href: "/size-guide", cta: "Open Size Guide" },
          { emoji: "📦", title: "Track your order?", desc: "Check status in your account dashboard", href: "/account", cta: "Go to My Orders" },
          { emoji: "↩️", title: "Return an item?", desc: "Step-by-step return wizard", href: "/returns", cta: "Start a Return" },
        ].map(item => (
          <motion.a key={item.title} href={item.href} whileHover={{ y: -3 }}
            className="border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/5 transition-colors">
            <span className="text-2xl">{item.emoji}</span>
            <p className="font-semibold text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
            <span className="text-xs text-[#C9A96E] font-medium mt-auto">{item.cta} →</span>
          </motion.a>
        ))}
      </div>

      {/* Social media */}
      {activeSocials.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-center">Follow Us on Social Media</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {activeSocials.map(({ key, label, Icon, bgColor, buildUrl }) => {
              const cfg = social[key];
              return (
                <motion.a key={key} href={buildUrl(cfg.value)} target="_blank" rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="border border-border rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-md transition-all"
                  style={{ borderColor: bgColor + "40" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: bgColor }}>
                    <Icon size={26} style={{ color: "#fff" }} />
                  </div>
                  <p className="font-semibold text-sm">{label}</p>
                  <Button size="sm" className="text-white text-xs h-7 px-3 rounded-full" style={{ backgroundColor: bgColor }}>Follow</Button>
                </motion.a>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact form + WhatsApp */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-5">
          <h2 className="font-serif text-2xl font-bold">Send Us a Message</h2>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle size={32} className="text-green-600" /></div>
              <h3 className="font-semibold text-lg">Message Sent!</h3>
              <p className="text-muted-foreground text-sm">Tracking ref: <code className="bg-muted px-2 py-0.5 rounded text-xs">{submitted}</code></p>
              <p className="text-xs text-muted-foreground">We'll reply to your email within 2 hours during working hours.</p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted("")}>Send Another Message</Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => u("name", e.target.value)} placeholder="Your name" data-testid="input-contact-name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.email} onChange={e => u("email", e.target.value)} placeholder="your@email.com" data-testid="input-contact-email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input value={form.phone} onChange={e => u("phone", e.target.value)} placeholder="+20 1XX XXX XXXX" data-testid="input-contact-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <select value={form.subject} onChange={e => u("subject", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="select-contact-subject">
                  <option value="">Choose a topic…</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Smart FAQ suggestions */}
              <SmartFAQ subject={form.subject} message={form.message} />

              <div className="space-y-1.5">
                <Label>Message <span className="text-destructive">*</span></Label>
                <textarea value={form.message} onChange={e => u("message", e.target.value)} rows={4}
                  placeholder="Tell us how we can help…"
                  className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="textarea-contact-message" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-foreground text-background hover:opacity-90 h-11" data-testid="button-contact-submit">
                <Send size={16} className="mr-2" />{submitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          {settings.whatsappButtonActive !== false && (
            <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto"><MessageCircle size={32} className="text-white" /></div>
              <h3 className="font-bold text-lg">Chat on WhatsApp</h3>
              <p className="text-sm text-muted-foreground">{settings.workingHours ?? "Available to help you"}</p>
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 h-11" data-testid="button-whatsapp-contact">
                <a href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} className="mr-2" />Start Chat Now
                </a>
              </Button>
            </div>
          )}
          <div className="border border-border rounded-xl p-6 text-center space-y-4">
            <h3 className="font-bold">Follow Us</h3>
            <div className="flex justify-center"><SocialIconsBar size="md" direction="row" data={social} /></div>
          </div>
        </div>
      </div>

      {settings.googleMapsUrl && (
        <div className="rounded-xl overflow-hidden border border-border h-72">
          <iframe src={settings.googleMapsUrl} width="100%" height="100%" loading="lazy" style={{ border: 0 }} allowFullScreen title="MU Store Location" />
        </div>
      )}
    </div>
  );
}
