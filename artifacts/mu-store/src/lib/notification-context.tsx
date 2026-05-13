import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface AppNotification {
  id: string;
  type: "order" | "wishlist" | "promo" | "system" | "welcome";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const KEY = "mu_notifications";
const MAX = 30;
const ctx = createContext<NotificationContextType | null>(null);

function load(): AppNotification[] {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}

function save(ns: AppNotification[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ns)); } catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(load);

  const sync = (ns: AppNotification[]) => { setNotifications(ns); save(ns); };

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    const item: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => {
      const updated = [item, ...prev].slice(0, MAX);
      save(updated);
      return updated;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      save(updated); return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      save(updated); return updated;
    });
  }, []);

  const clearAll = useCallback(() => { sync([]); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ctx.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}>
      {children}
    </ctx.Provider>
  );
}

export function useNotifications() {
  const c = useContext(ctx);
  if (!c) throw new Error("useNotifications must be inside NotificationProvider");
  return c;
}
