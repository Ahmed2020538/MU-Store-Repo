import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronDown, ChevronUp, CheckCircle, XCircle, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Breadcrumb from "@/components/Breadcrumb";

const PROCESS_STEPS = [
  { step: 1, title: "Check Eligibility", desc: "Item must be unused, in original packaging, within 14 days of delivery.", icon: "🔍" },
  { step: 2, title: "Contact Support", desc: "WhatsApp us with your order number and reason for return. We respond within 2 hours.", icon: "💬" },
  { step: 3, title: "Ship the Item", desc: "We'll send a pickup request or provide a drop-off address near you.", icon: "📦" },
  { step: 4, title: "Inspection", desc: "Our team inspects the returned item within 24 hours of receipt.", icon: "🔎" },
  { step: 5, title: "Refund or Exchange", desc: "Approved refunds are processed within 3–5 business days to your original payment method.", icon: "✅" },
];

const FAQS = [
  { q: "Can I return sale items?", a: "Items purchased on sale can be exchanged for size/color but are not eligible for cash refunds." },
  { q: "What if the item arrived damaged?", a: "Contact us within 48 hours of delivery with photos. We'll replace it immediately at no cost." },
  { q: "How long does a refund take?", a: "3–5 business days after we receive and inspect the item. You'll receive an email confirmation." },
  { q: "Can I exchange for a different product?", a: "Yes! If the price difference is more, you pay the difference. If less, we issue a store credit." },
];

type EligResult = "eligible" | "not_eligible" | null;

export default function ReturnsPolicyPage() {
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [condition, setCondition] = useState<string>("");
  const [eligResult, setEligResult] = useState<EligResult>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const checkEligibility = () => {
    if (daysSince === null || !condition) return;
    const eligible = daysSince <= 14 && condition === "unused";
    setEligResult(eligible ? "eligible" : "not_eligible");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Returns" }]} />

      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto">
          <RotateCcw size={26} className="text-[#C9A96E]" />
        </div>
        <h1 className="font-serif text-4xl font-bold">Returns & Exchanges</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Easy 14-day returns on all full-price items. We make it simple so you can shop with confidence.</p>
      </div>

      {/* Eligibility Checker */}
      <div className="border border-border rounded-2xl p-8 max-w-lg mx-auto bg-card space-y-6">
        <h2 className="font-semibold text-lg">Return Eligibility Checker</h2>
        <p className="text-sm text-muted-foreground">Answer two quick questions to see if your item qualifies for a return.</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">How many days ago did your order arrive?</label>
            <div className="grid grid-cols-4 gap-2">
              {[{ label: "1–7 days", val: 5 }, { label: "8–14 days", val: 12 }, { label: "15–30 days", val: 20 }, { label: "30+ days", val: 31 }].map(opt => (
                <button key={opt.label} onClick={() => { setDaysSince(opt.val); setEligResult(null); }}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${daysSince === opt.val ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What is the condition of the item?</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: "Unused, in original packaging", val: "unused" }, { label: "Worn or used", val: "used" }].map(opt => (
                <button key={opt.val} onClick={() => { setCondition(opt.val); setEligResult(null); }}
                  className={`py-3 px-3 rounded-lg border text-xs font-medium transition-colors text-center ${condition === opt.val ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={checkEligibility} disabled={daysSince === null || !condition} className="w-full bg-[#1A1A2E] text-white hover:opacity-90">
            Check Eligibility <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <AnimatePresence>
          {eligResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-xl p-5 text-center ${eligResult === "eligible" ? "bg-green-50 dark:bg-green-950/20 border border-green-200" : "bg-destructive/10 border border-destructive/20"}`}>
              {eligResult === "eligible" ? (
                <div className="space-y-2">
                  <CheckCircle size={28} className="text-green-600 mx-auto" />
                  <p className="font-semibold text-green-800 dark:text-green-400">Your item is eligible for return!</p>
                  <p className="text-xs text-muted-foreground">Start your return by contacting us on WhatsApp with your order number.</p>
                  <Button asChild size="sm" className="mt-2 bg-green-600 hover:bg-green-700 text-white">
                    <a href="https://wa.me/201000000000?text=I'd like to return order #" target="_blank" rel="noopener noreferrer">
                      <MessageCircle size={14} className="mr-2" /> Start Return via WhatsApp
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <XCircle size={28} className="text-destructive mx-auto" />
                  <p className="font-semibold text-destructive">This item may not qualify for a full return.</p>
                  <p className="text-xs text-muted-foreground">{daysSince! > 14 ? "Returns are only accepted within 14 days of delivery." : "Worn or used items cannot be returned, but may be eligible for repair or exchange."}</p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/contact">Contact Us for Help</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Return Process Steps */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">How Returns Work</h2>
        <div className="space-y-3">
          {PROCESS_STEPS.map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="flex items-start gap-4 border border-border rounded-xl p-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center text-lg">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#C9A96E] uppercase tracking-wide">Step {s.step}</span>
                </div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              {i < PROCESS_STEPS.length - 1 && <div className="flex-shrink-0 self-center"><ArrowRight size={16} className="text-muted-foreground" /></div>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Policy at a Glance */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: "📅", title: "14-Day Window", desc: "From delivery date for full-price items" },
          { icon: "📦", title: "Original Packaging", desc: "Items must be in original, undamaged box" },
          { icon: "💳", title: "Refund Methods", desc: "Original payment method or store credit" },
        ].map(item => (
          <div key={item.title} className="border border-border rounded-xl p-5 text-center">
            <span className="text-3xl">{item.icon}</span>
            <p className="font-semibold text-sm mt-2">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <h2 className="font-serif text-2xl font-bold">Returns FAQs</h2>
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted transition-colors">
              <span className="font-medium text-sm">{faq.q}</span>
              {openFaq === i ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
            </button>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
