import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const EMPTY = { name: "", logoUrl: "", websiteUrl: "", displayOrder: 0 };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; brand?: any }>({ open: false });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("mu_token");
  const auth = { headers: { Authorization: `Bearer ${token()}` } };
  const authJson = { headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" } };

  const load = async () => {
    setLoading(true);
    try { setBrands(await fetch("/api/admin/brands", auth).then(r => r.json())); }
    catch { toast.error("Failed to load"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY, displayOrder: brands.length }); setModal({ open: true }); };
  const openEdit = (b: any) => { setForm({ name: b.name, logoUrl: b.logoUrl ?? "", websiteUrl: b.websiteUrl ?? "", displayOrder: b.displayOrder ?? 0 }); setModal({ open: true, brand: b }); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const url = modal.brand ? `/api/admin/brands/${modal.brand.id}` : "/api/admin/brands";
      const method = modal.brand ? "PUT" : "POST";
      await fetch(url, { method, ...authJson, body: JSON.stringify(form) });
      toast.success(modal.brand ? "Updated" : "Created");
      setModal({ open: false });
      load();
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const del = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/admin/brands/${id}`, { method: "DELETE", ...auth });
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (b: any) => {
    await fetch(`/api/admin/brands/${b.id}`, { method: "PUT", ...authJson, body: JSON.stringify({ ...b, active: b.active ? 0 : 1 }) });
    load();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const arr = [...brands];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const order = arr.map((b, idx) => ({ id: b.id, displayOrder: idx }));
    await fetch("/api/admin/brands/reorder", { method: "POST", ...authJson, body: JSON.stringify({ order }) });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-2xl font-bold">Brands Manager</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Refresh</Button>
          <Button size="sm" className="bg-foreground text-background hover:opacity-90" onClick={openAdd}><Plus size={14} className="mr-1.5" />Add Brand</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? Array(8).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)
        : brands.map((b, i) => (
          <div key={b.id} className={`border border-border rounded-xl p-4 space-y-3 ${!b.active ? "opacity-50" : ""}`}>
            <div className="h-14 flex items-center justify-center rounded-lg bg-[#F9F5F0]">
              {b.logoUrl
                ? <img src={b.logoUrl} alt={b.name} className="max-h-10 object-contain" />
                : <span className="font-serif text-sm font-bold text-[#1A1A2E] text-center px-2">{b.name}</span>}
            </div>
            <p className="text-xs text-center text-muted-foreground truncate">{b.name}</p>
            <div className="flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp size={12} /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === brands.length - 1}><ChevronDown size={12} /></Button>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(b)} title={b.active ? "Hide" : "Show"}>{b.active ? <Eye size={12} /> : <EyeOff size={12} />}</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Edit size={12} /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(b.id, b.name)}><Trash2 size={12} /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold">{modal.brand ? "Edit Brand" : "Add Brand"}</h3>
            {[
              { label: "Brand Name *", key: "name", placeholder: "e.g. Steve Madden" },
              { label: "Logo URL", key: "logoUrl", placeholder: "https://..." },
              { label: "Website URL", key: "websiteUrl", placeholder: "https://..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
              </div>
            ))}
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
