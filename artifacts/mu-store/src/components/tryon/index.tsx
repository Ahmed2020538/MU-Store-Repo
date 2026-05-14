import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const TryItOnModal = lazy(() => import("./TryItOnModal"));

const SKIP_CATEGORIES = ["accessory", "accessories", "jewelry", "belt", "scarf", "hat", "cap"];

export interface TryItOnButtonProps {
  productName: string;
  productImage: string;
  productCategory?: string;
  className?: string;
  onAddToCart?: () => void;
}

export function TryItOnButton({
  productName,
  productImage,
  productCategory = "",
  className = "",
  onAddToCart,
}: TryItOnButtonProps) {
  const [open, setOpen] = useState(false);

  // Hide for unsupported categories
  const cat = productCategory.toLowerCase();
  if (SKIP_CATEGORIES.some(k => cat.includes(k))) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={[
          "flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-medium",
          "border-foreground/12 text-foreground/65 hover:border-[#C9A96E]/60 hover:text-[#C9A96E]",
          "transition-all duration-200",
          className,
        ].join(" ")}
        aria-label={`Virtually try on ${productName}`}
      >
        <Sparkles size={15} />
        Try It On
      </motion.button>

      <Suspense fallback={null}>
        {open && (
          <TryItOnModal
            open={open}
            onClose={() => setOpen(false)}
            productName={productName}
            productImage={productImage}
            productCategory={productCategory}
            onAddToCart={onAddToCart}
          />
        )}
      </Suspense>
    </>
  );
}

export { default as TryItOnModal } from "./TryItOnModal";
