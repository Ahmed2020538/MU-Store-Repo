import { motion } from "framer-motion";

interface Props {
  size?: number;
  pulse?: boolean;
  className?: string;
}

export default function MUStylistAvatar({ size = 28, pulse = true, className = "" }: Props) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}>
      {pulse && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-[#C9A96E]"
        />
      )}
      <motion.div
        whileHover={{ scale: 1.08 }}
        className="relative flex items-center justify-center rounded-full text-[#1A1A2E] font-serif font-bold select-none"
        style={{
          width: size, height: size,
          background: "linear-gradient(135deg, #C9A96E 0%, #D4B87E 50%, #B8904A 100%)",
          fontSize: size * 0.38,
          boxShadow: "0 2px 8px rgba(201,169,110,0.45)",
        }}>
        M
      </motion.div>
    </div>
  );
}
