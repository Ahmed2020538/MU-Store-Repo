import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const EMPTY = { customerName: "", customerCity: "", customerAvatarUrl: "", rating: 5, reviewText: "", reviewTextAr: "", productName: "", verifiedPurchase: 1, featured: 1, displayOrder: 0 };

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("mu_token");
  const auth = { headers: { Authorization: `Bearer ${token()}` } };
  const authJson = { headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" } };

  const load = async () => {
    setLoading(true);
    try { setItems(await fetch("/api/admin/testimonials", auth).then(r => r.json())); }
    catch { toast.error("Failed to load"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY, displayOrder: items.length }); setModal({ open: true }); };
  const openEdit = (t: any) => { setForm({ customerName: t.customerName, customerCity: t.customerCity ?? "", customerAvatarUrl: t.customerAvatarUrl ?? "", rating: t.rating ?? 5, reviewText: t.reviewText, reviewTextAr: t.reviewTextAr ?? "", productName: t.productName ?? "", verifiedPurchase: t.verifiedPurchase ?? 1, featured: t.featured ?? 1, displayOrder: t.displayOrder ?? 0 }); setModal({ open: true, item: t }); };

  const save = async () => {
    if (!form.customerName.trim() || !form.reviewText.trim()) { toast.error("Name and review required"); return; }
    setSaving(true);
    try {
      const url = modal.item ? `/api/admin/testimonials/${modal.item.id}` : "/api/admin/testimonials";
      const method = modal.item ? "PUT" : "POST";
      await fetch(url, { method, ...authJson, body: JSON.stringify(form) });
      toast.success(modal.item ? "Updated" : "Created");
      setModal({ open: false });
      load();
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE", ...auth });
    toast.success("Deleted");
    load();
  };

  const toggleFeatured = async (t: any) => {
    await fetch(`/api/admin/testimonials/${t.id}`, { method: "PUT", ...authJson, body: JSON.stringify({ featured: t.featured ? 0 : 1 }) });
    setItems(prev => prev.map(x => x.id === t.id ? { ...x, featured: x.featured ? 0 : 1 } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-2xl font-bold">Testimonials Manager</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Refresh</Button>
          <Button size="sm" className="bg-foreground text-background hover:opacity-90" onClick={openAdd}><Plus size={14} className="mr-1.5" />Add Review</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{["Customer", "City", "Rating", "Review", "Product", "Featured", "Actions"].map(h =>
                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>)
              : items.map(t => (
                <tr key={t.id} className={`hover:bg-muted/30 ${!t.featured ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{t.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.customerCity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= (t.rating ?? 5) ? "fill-[#C9A96E] text-[#C9A96E]" : "text-muted-foreground/30"} />)}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{t.reviewText}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.productName ?? "—"}</td>
                  <td className="px-4 py-3"><Switch checked={!!t.featured} onCheckedChange={() => toggleFeatured(t)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del(t.id)}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-background rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-4">
            <h3 className="font-serif text-xl font-bold">{modal.item ? "Edit Testimonial" : "Add Testimonial"}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[{ label: "Customer Name *", key: "customerName" }, { label: "City", key: "customerCity" }].map(({ label, key }) => (
                <div key={key} className="space-y-1.5"><Label>{label}</Label><Input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))} className={`p-1.5 rounded-lg ${form.rating >= n ? "bg-[#C9A96E]/20" : ""}`}><Star size={18} className={form.rating >= n ? "fill-[#C9A96E] text-[#C9A96E]" : "text-muted-foreground"} /></button>)}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Review (English) *</Label><textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none bg-background" value={form.reviewText} onChange={e => setForm(f => ({ ...f, reviewText: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Review (Arabic)</Label><textarea rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none bg-background" dir="rtl" value={form.reviewTextAr} onChange={e => setForm(f => ({ ...f, reviewTextAr: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Product Name</Label><Input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Optional" /></div>
            <div className="flex items-center gap-3"><Switch checked={!!form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v ? 1 : 0 }))} /><Label>Featured on homepage</Label></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setModal({ open: false })}>Cancel</Button>
              <Button className="flex-1 bg-foreground text-background hover:opacity-90" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
