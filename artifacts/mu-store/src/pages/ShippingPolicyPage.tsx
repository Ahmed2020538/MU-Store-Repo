import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, MapPin, Clock, CheckCircle, ChevronDown, ChevronUp, Gift } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

const TIMELINE_STEPS = [
  { icon: Package, label: "Order Placed", desc: "You receive a confirmation email immediately.", color: "bg-[#C9A96E]", time: "Day 0" },
  { icon: CheckCircle, label: "Order Confirmed", desc: "Our team reviews and confirms your order within 2–4 hours.", color: "bg-blue-500", time: "Within 4 hrs" },
  { icon: Gift, label: "Packed with Love", desc: "Your items are carefully packed in our signature MU box.", color: "bg-purple-500", time: "Day 1" },
  { icon: Truck, label: "Out for Delivery", desc: "Handed to our courier partner and on the way to you.", color: "bg-orange-500", time: "Day 1–2" },
  { icon: MapPin, label: "Delivered!", desc: "Your order arrives at your door. Enjoy your new MU pieces!", color: "bg-green-500", time: "Day 2–5" },
];

const CAIRO_GOVS = ["Cairo", "Giza", "Alexandria", "Qalyubia"];
const GOVERNORATES = ["Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Beheira", "Fayoum", "Gharbiya", "Ismailia", "Menofia", "Minya", "New Valley", "Suez", "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharqia", "South Sinai", "Kafr El Sheikh", "Matrouh", "Luxor", "Qena", "Sohag", "North Sinai", "Red Sea"];

const FAQS = [
  { q: "When does free shipping apply?", a: "Orders over 500 EGP get free standard delivery anywhere in Egypt." },
  { q: "What if I'm not home for delivery?", a: "Our courier will attempt delivery twice. If both attempts fail, the package returns to us and we'll contact you to reschedule." },
  { q: "Can I change my delivery address after ordering?", a: "Yes, within 2 hours of placing the order. Contact us immediately via WhatsApp." },
  { q: "Do you ship outside Egypt?", a: "Currently we ship within Egypt only. International shipping is coming soon!" },
  { q: "What is Cash on Delivery?", a: "You pay in cash when the courier arrives. A 20 EGP service fee applies. Available in all governorates." },
];

export default function ShippingPolicyPage() {
  const [gov, setGov] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isFast = CAIRO_GOVS.includes(gov);
  const estimate = gov ? (isFast ? "1–2 business days" : "3–5 business days") : null;
  const fee = gov ? (isFast ? "30 EGP standard · Free over 500 EGP" : "50 EGP standard · Free over 500 EGP") : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shipping Policy" }]} />

      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto">
          <Truck size={26} className="text-[#C9A96E]" />
        </div>
        <h1 className="font-serif text-4xl font-bold">Shipping Policy</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Fast, safe delivery across all of Egypt. Free shipping on orders over 500 EGP.</p>
      </div>

      {/* Delivery Estimator */}
      <div className="border border-[#C9A96E]/30 bg-[#C9A96E]/5 rounded-2xl p-8 max-w-lg mx-auto space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Clock size={18} className="text-[#C9A96E]" /> Delivery Estimator</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Select your governorate</label>
          <select value={gov} onChange={e => setGov(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50">
            <option value="">Choose governorate…</option>
            {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <AnimatePresence>
          {estimate && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3">
              <div className="bg-background rounded-xl p-4 text-center border border-border">
                <Clock size={18} className="mx-auto mb-1 text-[#C9A96E]" />
                <p className="text-xs text-muted-foreground">Estimated Time</p>
                <p className="font-bold text-sm mt-0.5">{estimate}</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center border border-border">
                <Truck size={18} className="mx-auto mb-1 text-[#C9A96E]" />
                <p className="text-xs text-muted-foreground">Delivery Fee</p>
                <p className="font-bold text-sm mt-0.5">{fee}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual Timeline */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">Your Order's Journey</h2>
        <div className="relative">
          <div className="absolute left-6 top-6 bottom-6 w-px bg-border hidden sm:block" />
          <div className="space-y-4">
            {TIMELINE_STEPS.map((step, i) => (
              <motion.div key={step.label} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 pl-0 sm:pl-16 relative">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${step.color} flex items-center justify-center sm:absolute sm:left-0 sm:top-0`}>
                  <step.icon size={20} className="text-white" />
                </div>
                <div className="flex-1 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{step.label}</p>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{step.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping Options Table */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">Shipping Options</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {["Method", "Delivery Time", "Cost", "Available In"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { method: "Standard Delivery", time: "2–5 business days", cost: "30–50 EGP (free over 500 EGP)", where: "All of Egypt" },
                { method: "Express Delivery", time: "Next business day", cost: "80 EGP", where: "Cairo & Giza only" },
                { method: "Cash on Delivery", time: "2–5 business days", cost: "+20 EGP service fee", where: "All of Egypt" },
              ].map(row => (
                <tr key={row.method} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{row.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.time}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.cost}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <h2 className="font-serif text-2xl font-bold">Shipping FAQs</h2>
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
