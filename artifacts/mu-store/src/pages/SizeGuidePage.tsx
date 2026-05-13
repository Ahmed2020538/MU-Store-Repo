import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Breadcrumb from "@/components/Breadcrumb";

const SIZE_CHART = [
  { eu: "35", us: "5", uk: "2.5", cm: "22.5" },
  { eu: "36", us: "6", uk: "3.5", cm: "23.0" },
  { eu: "37", us: "6.5", uk: "4", cm: "23.5" },
  { eu: "38", us: "7.5", uk: "5", cm: "24.0" },
  { eu: "39", us: "8.5", uk: "6", cm: "25.0" },
  { eu: "40", us: "9", uk: "6.5", cm: "25.5" },
  { eu: "41", us: "10", uk: "7.5", cm: "26.0" },
  { eu: "42", us: "11", uk: "8.5", cm: "27.0" },
];

const TIPS = [
  { icon: "🕐", title: "Measure in the evening", desc: "Feet swell throughout the day — measuring in the evening gives the most accurate result." },
  { icon: "🧦", title: "Wear your usual socks", desc: "Measure with the socks you'd normally wear, or barefoot for sandals." },
  { icon: "📏", title: "Measure both feet", desc: "Feet are often slightly different sizes. Use the larger measurement for your size." },
  { icon: "📝", title: "Round up when between sizes", desc: "If your foot falls between two sizes, go with the larger one for comfort." },
];

const FAQS = [
  { q: "What if I'm between two sizes?", a: "We recommend going up a half size for heels and flats. For boots, go with your true size as leather stretches." },
  { q: "Do MU shoes run true to size?", a: "Our heels run true to EU size. Flats tend to run slightly large — consider going half a size down." },
  { q: "Can I exchange for a different size?", a: "Yes! Free size exchanges within 14 days of delivery on unworn items." },
];

function cmToEU(cm: number): string | null {
  const closest = SIZE_CHART.reduce((best, row) => {
    return Math.abs(parseFloat(row.cm) - cm) < Math.abs(parseFloat(best.cm) - cm) ? row : best;
  });
  return parseFloat(closest.cm) - cm <= 0.6 ? closest.eu : null;
}

export default function SizeGuidePage() {
  const [measurement, setMeasurement] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const handleFind = () => {
    const val = parseFloat(measurement);
    if (!val || val < 20 || val > 30) { setResult("invalid"); return; }
    const eu = cmToEU(val);
    setResult(eu ?? "out_of_range");
    if (eu) setHighlight(eu);
    setChecked(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Size Guide" }]} />

      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto">
          <Ruler size={26} className="text-[#C9A96E]" />
        </div>
        <h1 className="font-serif text-4xl font-bold">Find Your Perfect Size</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Answer a few questions and we'll recommend the right MU size for your feet.</p>
      </div>

      {/* Interactive Finder */}
      <div className="border border-border rounded-2xl p-8 bg-card space-y-6 max-w-lg mx-auto">
        <h2 className="font-semibold text-lg">Size Finder</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">What is your foot length? (cm)</label>
          <div className="flex gap-3">
            <input
              type="number" step="0.1" min="20" max="30" value={measurement}
              onChange={e => { setMeasurement(e.target.value); setResult(null); setHighlight(null); }}
              placeholder="e.g. 24.5"
              className="flex-1 border border-border rounded-lg px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50"
            />
            <Button onClick={handleFind} className="bg-[#1A1A2E] text-white hover:opacity-90 px-6">Find Size</Button>
          </div>
          <p className="text-xs text-muted-foreground">Measure from your heel to the tip of your longest toe on a flat surface.</p>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-xl p-4 text-center ${result === "invalid" || result === "out_of_range" ? "bg-destructive/10 border border-destructive/20" : "bg-green-50 dark:bg-green-950/20 border border-green-200"}`}>
              {result === "invalid" && <p className="text-sm text-destructive font-medium">Please enter a valid foot length between 20–30 cm.</p>}
              {result === "out_of_range" && <p className="text-sm text-destructive font-medium">This measurement is outside our range. Please contact us for help.</p>}
              {result !== "invalid" && result !== "out_of_range" && (
                <div className="space-y-1">
                  <CheckCircle size={24} className="text-green-600 mx-auto" />
                  <p className="text-sm text-muted-foreground">Your recommended MU size is</p>
                  <p className="text-4xl font-bold text-[#1A1A2E] dark:text-white">EU {result}</p>
                  <p className="text-xs text-muted-foreground mt-1">See highlighted row in the chart below</p>
                  <Button asChild size="sm" className="mt-3 bg-[#C9A96E] text-[#1A1A2E] hover:opacity-90">
                    <Link href={`/products?size=${result}`}>Shop Size {result}</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!checked && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Don't have a tape measure?</p>
            <p className="text-xs text-muted-foreground">Trace your foot on paper and measure the outline with a ruler.</p>
          </div>
        )}
      </div>

      {/* Size Chart */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">Full Size Chart</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {["EU", "US", "UK", "Length (cm)"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map(row => (
                <motion.tr key={row.eu} animate={{ backgroundColor: highlight === row.eu ? "#C9A96E22" : "transparent" }}
                  className={`border-t border-border transition-colors ${highlight === row.eu ? "ring-2 ring-inset ring-[#C9A96E]" : "hover:bg-muted/50"}`}>
                  <td className="px-4 py-3 font-bold">{row.eu} {highlight === row.eu && <span className="ml-2 text-[#C9A96E] text-xs">◀ Your size</span>}</td>
                  <td className="px-4 py-3">{row.us}</td>
                  <td className="px-4 py-3">{row.uk}</td>
                  <td className="px-4 py-3">{row.cm}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Measuring Tips */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">Tips for the Best Fit</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {TIPS.map(tip => (
            <div key={tip.title} className="border border-border rounded-xl p-4 flex gap-4 items-start">
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="font-semibold text-sm">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <h2 className="font-serif text-2xl font-bold">Sizing FAQs</h2>
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

      <div className="text-center pt-4 border-t border-border">
        <p className="text-muted-foreground text-sm mb-3">Still unsure about your size?</p>
        <Button asChild variant="outline" className="border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10">
          <Link href="/contact">Ask Us on WhatsApp</Link>
        </Button>
      </div>
    </div>
  );
}
