import { useState, useEffect } from "react";
import { Trash2, Eye, RefreshCw, Mail, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, unreadToday: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const token = () => localStorage.getItem("mu_token");
  const auth = { headers: { Authorization: `Bearer ${token()}` } };

  const load = async () => {
    setLoading(true);
    try {
      const [msgs, st] = await Promise.all([
        fetch("/api/contact/admin", auth).then(r => r.json()),
        fetch("/api/contact/admin/stats", auth).then(r => r.json()),
      ]);
      setMessages(msgs);
      setStats(st);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/contact/admin/${id}/read`, { method: "PUT", ...auth });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    if (selected?.id === id) setSelected((s: any) => s ? { ...s, isRead: true } : s);
    setStats(s => ({ ...s, unread: Math.max(0, s.unread - 1) }));
  };

  const del = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/contact/admin/${id}`, { method: "DELETE", ...auth });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold">Contact Messages</h2>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Unread", value: stats.unread },
          { label: "Unread Today", value: stats.unreadToday },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* List */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {loading ? <p className="p-6 text-center text-muted-foreground">Loading…</p>
            : !messages.length ? <p className="p-6 text-center text-muted-foreground">No messages yet</p>
            : messages.map(m => (
              <button key={m.id} onClick={async () => { setSelected(m); if (!m.isRead) await markRead(m.id); }}
                className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selected?.id === m.id ? "bg-muted/60" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${m.isRead ? "bg-transparent" : "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${!m.isRead ? "font-bold" : "font-medium"}`}>{m.name}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${!m.isRead ? "text-foreground" : "text-muted-foreground"}`}>{m.subject}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        {selected ? (
          <div className="border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{selected.subject}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selected.name} — <a href={`mailto:${selected.email}`} className="underline">{selected.email}</a></p>
                {selected.phone && <p className="text-xs text-muted-foreground">{selected.phone}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {!selected.isRead && (
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => markRead(selected.id)} title="Mark read"><MailOpen size={14} /></Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del(selected.id)} title="Delete"><Trash2 size={14} /></Button>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap" dir="rtl">{selected.message}</p>
            </div>
            {selected.trackingRef && (
              <p className="text-xs text-muted-foreground">Ref: <code className="bg-muted px-1.5 py-0.5 rounded">{selected.trackingRef}</code></p>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground h-48">
            <div className="text-center"><Mail size={24} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select a message to view</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
