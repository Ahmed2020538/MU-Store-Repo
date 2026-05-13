import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok, FaYoutube, FaSnapchat, FaPinterest, FaXTwitter } from "react-icons/fa6";
import type { ComponentType } from "react";

export interface SocialPlatform {
  key: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
  buildUrl: (value: string) => string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: FaWhatsapp as any,
    color: "#25D366",
    bgColor: "#25D366",
    buildUrl: v => `https://wa.me/${v.replace(/\D/g, "")}?text=مرحباً`,
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: FaInstagram as any,
    color: "#E1306C",
    bgColor: "#E1306C",
    buildUrl: v => v.startsWith("http") ? v : `https://instagram.com/${v.replace("@", "")}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: FaFacebook as any,
    color: "#1877F2",
    bgColor: "#1877F2",
    buildUrl: v => v.startsWith("http") ? v : `https://facebook.com/${v}`,
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: FaTiktok as any,
    color: "#010101",
    bgColor: "#010101",
    buildUrl: v => v.startsWith("http") ? v : `https://tiktok.com/@${v.replace("@", "")}`,
  },
  {
    key: "youtube",
    label: "YouTube",
    Icon: FaYoutube as any,
    color: "#FF0000",
    bgColor: "#FF0000",
    buildUrl: v => v.startsWith("http") ? v : `https://youtube.com/${v}`,
  },
  {
    key: "snapchat",
    label: "Snapchat",
    Icon: FaSnapchat as any,
    color: "#FFFC00",
    bgColor: "#FFFC00",
    buildUrl: v => v.startsWith("http") ? v : `https://snapchat.com/add/${v}`,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    Icon: FaPinterest as any,
    color: "#E60023",
    bgColor: "#E60023",
    buildUrl: v => v.startsWith("http") ? v : `https://pinterest.com/${v}`,
  },
  {
    key: "twitter",
    label: "X",
    Icon: FaXTwitter as any,
    color: "#000000",
    bgColor: "#000000",
    buildUrl: v => v.startsWith("http") ? v : `https://x.com/${v.replace("@", "")}`,
  },
];

export const SOCIAL_MAP = Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.key, p]));
