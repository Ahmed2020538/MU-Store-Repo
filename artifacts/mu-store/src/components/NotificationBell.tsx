import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Package, Heart, Tag, Sparkles, CheckCheck, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useNotifications, type AppNotification } from "@/lib/notification-context";

const ICON_MAP: Record<AppNotification["type"], typeof Bell> = {
  order: Package, wishlist: Heart, promo: Tag, system: Sparkles, welcome: Sparkles,
};
const COLOR_MAP: Record<AppNotification["type"], string> = {
  order: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  wishlist: "bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  promo: "bg-[#C9A96E]/15 text-[#C9A96E]",
  system: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  welcome: "bg-[#C9A96E]/15 text-[#C9A96E]",
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const handleClick = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
        data-testid="notification-bell"
      >
        <Bell size={20} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#C9A96E] text-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-[#C9A96E]" />
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-[#C9A96E]/15 text-[#C9A96E] px-1.5 py-0.5 rounded-full font-semibold">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} title="Mark all read"
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <CheckCheck size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} title="Clear all"
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map(n => {
                    const Icon = ICON_MAP[n.type] ?? Bell;
                    const colorClass = COLOR_MAP[n.type] ?? "bg-muted text-muted-foreground";
                    const content = (
                      <div
                        onClick={() => handleClick(n)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted ${!n.read ? "bg-[#C9A96E]/5" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-medium leading-tight ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                    return n.href ? (
                      <Link key={n.id} href={n.href}>{content}</Link>
                    ) : (
                      <div key={n.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
