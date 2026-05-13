import { useState, useEffect } from "react";
import { RefreshCw, Trash2, RotateCcw, CalendarPlus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Filter = "all" | "active" | "used" | "expired" | "birthday";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, birthday: 0, active: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const token = () => localStorage.getItem("mu_token");
  const auth = { headers: { Authorization: `Bearer ${token()}` } };

  const load = async () => {
    setLoading(true);
    try {
      const [data, st] = await Promise.all([
        fetch("/api/admin/coupons", auth).then(r => r.json()),
        fetch("/api/admin/coupons/stats", auth).then(r => r.json()),
      ]);
      setCoupons(Array.isArray(data) ? data : []);
      setStats(st);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleUsed = async (id: number) => {
    const r = await fetch(`/api/admin/coupons/${id}/toggle-used`, { method: "PUT", ...auth });
    if (r.ok) { const d = await r.json(); setCoupons(prev => prev.map(c => c.id === id ? { ...d, isActive: !d.used } : c)); toast.success("Updated"); }
  };

  const extend = async (id: number) => {
    const r = await fetch(`/api/admin/coupons/${id}/extend`, { method: "PUT", ...auth });
    if (r.ok) { toast.success("Extended by 7 days"); load(); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE", ...auth });
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast.success("Deleted");
  };

  const bulkDeleteExpired = async () => {
    if (!confirm("Delete ALL expired coupons?")) return;
    const r = await fetch("/api/admin/coupons/bulk/expired", { method: "DELETE", ...auth });
    const d = await r.json();
    toast.success(`Deleted ${d.deleted} expired coupons`);
    load();
  };

  const visible = coupons.filter(c => {
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? c.isActive :
      filter === "used" ? c.used :
      filter === "expired" ? c.isExpired :
      filter === "birthday" ? c.source === "birthday" : true;
    const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.userName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "active", label: "Active", count: stats.active },
    { key: "birthday", label: "Birthday", count: stats.birthday },
    { key: "used", label: "Used", count: stats.used },
    { key: "expired", label: "Expired", count: stats.expired },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif text-2xl font-bold">Coupons Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={bulkDeleteExpired} className="text-destructive border-destructive/30 hover:bg-destructive/5">
            <Trash2 size={14} className="mr-1.5" />Delete Expired
          </Button>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Refresh</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Birthday", value: stats.birthday, color: "text-[#C9A96E]" },
          { label: "Used", value: stats.used, color: "text-blue-600" },
          { label: "Expired", value: stats.expired, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-border rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
              {label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          ))}
        </div>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or customer…" className="h-8 text-xs max-w-48 ml-auto" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{["Code", "Customer", "Discount", "Source", "Expires", "Status", "Actions"].map(h =>
                <th key={h} className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              : !visible.length ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No coupons</td></tr>
              : visible.map(c => (
                <tr key={c.id} className={`hover:bg-muted/30 ${c.isExpired ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2.5">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{c.code}</code>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-xs">{c.userName ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{c.userEmail}</p>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[#C9A96E]">{c.discountPercent}%</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.source === "birthday" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.used ? "bg-blue-100 text-blue-700" : c.isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {c.used ? "Used" : c.isExpired ? "Expired" : "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => toggleUsed(c.id)} title={c.used ? "Mark unused" : "Mark used"}><RotateCcw size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => extend(c.id)} title="Extend 7 days"><CalendarPlus size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(c.id)} title="Delete"><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
