import { Link } from "wouter";
import { useEffect, useState } from "react";
import SocialIconsBar from "./SocialIconsBar";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-serif text-3xl font-bold tracking-widest text-[#C9A96E]">MU</span>
            <p className="mt-2 text-sm text-background/70 italic">Where Every Step Tells Your Story</p>
            <p className="mt-4 text-sm text-background/60 max-w-sm">
              Premium Egyptian women's shoes and bags, crafted with care and designed to make every moment unforgettable.
            </p>

            {/* Follow Us — expanded social icons with labels */}
            <div className="mt-6">
              <p className="text-xs tracking-widest uppercase text-[#C9A96E] mb-3">Follow Us · تابعينا</p>
              <SocialIconsBar size="sm" variant="expanded" showLabels data={social} />
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-[#C9A96E] mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {["Heels", "Flats", "Boots", "Bags", "Accessories"].map(cat => (
                <li key={cat}><Link href={`/products?category=${cat.toLowerCase()}`} className="hover:text-background transition-colors">{cat}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-[#C9A96E] mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link href="/account" className="hover:text-background transition-colors">My Account</Link></li>
              <li><Link href="/contact" className="hover:text-background transition-colors">Contact Us</Link></li>
              <li><a href="#" className="hover:text-background transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Returns</a></li>
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
    </footer>
  );
}
