import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa6";

export default function WhatsAppFAB() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem("mu_contact_cfg");
    if (cached) { setConfig(JSON.parse(cached)); return; }
    fetch("/api/settings/contact").then(r => r.json()).then(d => {
      setConfig(d);
      sessionStorage.setItem("mu_contact_cfg", JSON.stringify(d));
    }).catch(() => setConfig({}));
  }, []);

  if (!config) return null;
  if (config.whatsappButtonActive === false) return null;

  const num = (config.whatsappNumber ?? "201000000000").replace(/\D/g, "");
  const msg = encodeURIComponent(config.whatsappMessage ?? "Hello, I'd like to inquire about a product");
  const color = config.whatsappButtonColor ?? "#25D366";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4 }}
          className="fixed bottom-6 right-6 z-50"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-3 bg-[#1A1A2E] text-white text-xs py-2 px-3 rounded-xl whitespace-nowrap shadow-xl border border-white/10"
              >
                <p className="font-medium">Chat with us on WhatsApp</p>
                {config.workingHours && <p className="text-white/50 text-[10px] mt-0.5">{config.workingHours}</p>}
                <div className="absolute bottom-0 right-5 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1A1A2E]" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.a
            href={`https://wa.me/${num}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            animate={hovered ? { scale: 1 } : { scale: [1, 1.08, 1] }}
            transition={hovered ? { duration: 0.2 } : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: color }}
            data-testid="button-whatsapp-fab"
          >
            <FaWhatsapp size={28} color="white" />
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
