import { Link } from "wouter";
import { useEffect, useState } from "react";
import { MessageCircle, Instagram, Facebook, Youtube, Share2 } from "lucide-react";

const PLATFORM_META: Record<string, { icon: any; label: string; buildUrl: (v: string) => string }> = {
  whatsapp:  { icon: MessageCircle, label: "WhatsApp", buildUrl: v => `https://wa.me/${v.replace(/\D/g, "")}?text=مرحباً` },
  instagram: { icon: Instagram,     label: "Instagram", buildUrl: v => v.startsWith("http") ? v : `https://instagram.com/${v}` },
  facebook:  { icon: Facebook,      label: "Facebook",  buildUrl: v => v.startsWith("http") ? v : `https://facebook.com/${v}` },
  youtube:   { icon: Youtube,       label: "YouTube",   buildUrl: v => v.startsWith("http") ? v : `https://youtube.com/${v}` },
  tiktok:    { icon: Share2,        label: "TikTok",    buildUrl: v => v.startsWith("http") ? v : `https://tiktok.com/@${v}` },
  pinterest: { icon: Share2,        label: "Pinterest", buildUrl: v => v.startsWith("http") ? v : `https://pinterest.com/${v}` },
  snapchat:  { icon: Share2,        label: "Snapchat",  buildUrl: v => v.startsWith("http") ? v : `https://snapchat.com/add/${v}` },
  twitter:   { icon: Share2,        label: "X",         buildUrl: v => v.startsWith("http") ? v : `https://x.com/${v}` },
};

export default function Footer() {
  const [social, setSocial] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/settings/social").then(r => r.json()).then(setSocial).catch(() => {});
  }, []);

  const activeSocials = Object.entries(social)
    .filter(([, cfg]) => cfg.active && cfg.value)
    .sort(([, a], [, b]) => (a.order ?? 99) - (b.order ?? 99));

  const whatsappNum = social.whatsapp?.value ?? "201000000000";

  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="font-serif text-3xl font-bold tracking-widest text-[#C9A96E]">MU</span>
            <p className="mt-2 text-sm text-background/70 italic">Where Every Step Tells Your Story</p>
            <p className="mt-4 text-sm text-background/60 max-w-sm">
              Premium Egyptian women's shoes and bags, crafted with care and designed to make every moment unforgettable.
            </p>
            <div className="flex gap-3 mt-4">
              {activeSocials.length > 0 ? activeSocials.map(([key, cfg]) => {
                const meta = PLATFORM_META[key];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <a key={key} href={meta.buildUrl(cfg.value)} target="_blank" rel="noopener noreferrer"
                    aria-label={meta.label}
                    className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-[#C9A96E]/20 transition-colors">
                    <Icon size={18} />
                  </a>
                );
              }) : (
                <>
                  <a href={`https://wa.me/${whatsappNum}?text=مرحباً`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-[#C9A96E]/20 transition-colors">
                    <MessageCircle size={18} />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-[#C9A96E]/20 transition-colors">
                    <Instagram size={18} />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-[#C9A96E]/20 transition-colors">
                    <Facebook size={18} />
                  </a>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-[#C9A96E] mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {["Heels", "Flats", "Boots", "Bags", "Accessories"].map(cat => (
                <li key={cat}><Link href={`/products?category=${cat.toLowerCase()}`} className="hover:text-background transition-colors">{cat}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-[#C9A96E] mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link href="/account" className="hover:text-background transition-colors">My Account</Link></li>
              <li><a href="#" className="hover:text-background transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Returns</a></li>
              <li><a href={`https://wa.me/${whatsappNum}?text=مرحباً`} target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/50">© {new Date().getFullYear()} MU. All rights reserved. Made with love in Egypt.</p>
          <div className="flex gap-4 text-xs text-background/50">
            <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${whatsappNum}?text=مرحباً`} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        data-testid="button-whatsapp">
        <MessageCircle size={24} />
      </a>
    </footer>
  );
}
