import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import SocialIconsBar from "./SocialIconsBar";
import { StoreLocationSection } from "./location";

function NewsletterStrip() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    await new Promise(r => setTimeout(r, 900));
    setState("done");
    setEmail("");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-7 mb-10"
      style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 100%)", border: "1px solid rgba(201,169,110,0.20)" }}>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1 text-center sm:text-left">
          <p className="font-serif text-lg font-bold text-[#C9A96E]">Get Exclusive Deals</p>
          <p className="text-xs text-background/55 mt-0.5">New arrivals, private sales & style tips — straight to your inbox.</p>
        </div>
        <AnimatePresence mode="wait">
          {state === "done" ? (
            <motion.p key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-sm font-medium text-[#C9A96E]">
              ✓ You're on the list!
            </motion.p>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit}
              className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 sm:w-52 bg-background/10 border border-background/20 rounded-lg px-3 py-2 text-sm text-background placeholder-background/40 focus:outline-none focus:border-[#C9A96E]/60"
                aria-label="Email address for newsletter"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.94 }}
                disabled={state === "loading"}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#1A1A2E] bg-[#C9A96E] hover:bg-[#d4b87e] transition-colors disabled:opacity-60"
              >
                {state === "loading" ? "…" : <><Mail size={13} /><span className="hidden sm:inline">Subscribe</span><ArrowRight size={13} /></>}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FollowUsSection({ social }: { social: Record<string, any> }) {
  const hasAny = Object.values(social).some((v: any) => v?.active && v?.value);
  if (!hasAny) return null;

  return (
    <div className="border-t border-background/10 pt-10 pb-2">
      <div className="text-center mb-8 space-y-2">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] font-medium"
        >
          Stay Connected
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="font-serif text-2xl font-bold text-background"
        >
          Follow Us
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="text-xs text-background/45 max-w-xs mx-auto"
        >
          Behind-the-scenes, new drops & style inspiration — join our community
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SocialIconsBar variant="footer" data={social} />
      </motion.div>
    </div>
  );
}

export default function Footer() {
  const [social, setSocial] = useState<Record<string, any>>({});

  useEffect(() => {
    const cached = sessionStorage.getItem("mu_social_v2");
    if (cached) { setSocial(JSON.parse(cached)); return; }
    fetch("/api/settings/social").then(r => r.json()).then(d => {
      setSocial(d);
      sessionStorage.setItem("mu_social_v2", JSON.stringify(d));
    }).catch(() => {});
  }, []);

  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 space-y-10">

        {/* Newsletter */}
        <NewsletterStrip />

        {/* Main columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-serif text-3xl font-bold tracking-widest text-[#C9A96E]">MU</span>
            <p className="mt-2 text-sm text-background/70 italic">Where Every Step Tells Your Story</p>
            <p className="mt-3 text-sm text-background/50 max-w-sm leading-relaxed">
              Premium Egyptian women's shoes and bags, crafted with care and designed to make every moment unforgettable.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { label: "🇪🇬 Made in Egypt", color: "rgba(201,169,110,0.15)" },
                { label: "✦ Handcrafted", color: "rgba(255,255,255,0.06)" },
                { label: "🌿 Sustainable", color: "rgba(255,255,255,0.06)" },
              ].map(b => (
                <span key={b.label} className="text-[11px] px-2.5 py-1 rounded-full text-background/60 border border-background/10" style={{ background: b.color }}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C9A96E] mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              {[
                { label: "Heels", href: "/products?category=heels" },
                { label: "Flats", href: "/products?category=flats" },
                { label: "Boots", href: "/products?category=boots" },
                { label: "Bags", href: "/products?category=bags" },
                { label: "Accessories", href: "/products?category=accessories" },
                { label: "Sale", href: "/products?sale=true" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-background transition-colors hover:translate-x-0.5 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C9A96E] mb-4">Help</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              {[
                { label: "My Account", href: "/account" },
                { label: "Contact Us", href: "/contact" },
                { label: "Size Guide", href: "/size-guide" },
                { label: "Shipping Policy", href: "/shipping" },
                { label: "Returns", href: "/returns" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-background transition-colors hover:translate-x-0.5 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Store Location */}
        <StoreLocationSection />

        {/* Follow Us — full-width social strip */}
        <FollowUsSection social={social} />

        {/* Bottom bar */}
        <div className="pt-5 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-background/35">
            © {new Date().getFullYear()} MU Store. All rights reserved. Made with ♥ in Egypt.
          </p>
          <div className="flex gap-5 text-[11px] text-background/35">
            <a href="#" className="hover:text-background/70 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background/70 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-background/70 transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
