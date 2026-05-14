import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import TryItOnModal from "./TryItOnModal";

export { default as TryItOnModal } from "./TryItOnModal";
export { default as TryOnCapture } from "./TryOnCapture";

export interface TryItOnButtonProps {
  productName: string;
  productImage: string;
  productCategory?: string;
  className?: string;
  size?: "sm" | "md";
}

export function TryItOnButton({
  productName,
  productImage,
  productCategory = "shoes",
  className = "",
  size = "md",
}: TryItOnButtonProps) {
  const [open, setOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  useEffect(() => {
    setHasCamera(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Don't render until we know camera availability (avoids flash)
  if (hasCamera === null || !hasCamera) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={[
          "flex items-center justify-center gap-2 font-semibold rounded-2xl border-2",
          "border-foreground/15 text-foreground/80 hover:border-[#C9A96E] hover:text-[#C9A96E]",
          "transition-all duration-200",
          size === "sm"
            ? "px-3 py-2 text-xs"
            : "px-4 py-3 text-sm",
          className,
        ].join(" ")}
        title="Virtually try this product on using your camera"
      >
        <Camera size={size === "sm" ? 13 : 16} />
        Try It On
      </motion.button>

      <TryItOnModal
        open={open}
        onClose={() => setOpen(false)}
        productName={productName}
        productImage={productImage}
        productCategory={productCategory}
      />
    </>
  );
}
