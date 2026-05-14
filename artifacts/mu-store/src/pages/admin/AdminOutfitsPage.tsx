import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Product { id: number; name: string; images: string[]; price: number; }
interface OutfitItem { productId: number; role: string; product?: Product; }
interface Outfit { id: number; name: string; nameAr?: string; occasion: string; description?: string; coverImage?: string; isPublished: boolean; items?: OutfitItem[]; }

const OCCASIONS = ["casual", "work", "evening", "wedding"];
const OCCASION_COLORS: Record<string, string> = {
  casual: "bg-sky-100 text-sky-700", work: "bg-amber-100 text-amber-800",
  evening: "bg-purple-100 text-purple-800", wedding: "bg-rose-100 text-rose-700",
};
const token = () => localStorage.getItem("mu_token") ?? "";
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const EMPTY: Partial<Outfit & { items: OutfitItem[] }> = { name: "", nameAr: "", occasion: "casual", description: "", coverImage: "", isPublished: false, items: [] };

export default function AdminOutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [editing, setEditing] = useState<Partial<Outfit & { items: OutfitItem[] }> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/outfits?all=1", { headers: authH() }).then(r => r.json())
      .then(d => setOutfits(Array.isArray(d) ? d : [])).catch(() => {});

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...EMPTY, items: [] });
  const openEdit = async (o: Outfit) => {
    const detail = await fetch(`/api/outfits/${o.id}`, { headers: authH() }).then(r => r.json());
    setEditing(detail);
    if (!products.length) loadProducts();
  };
  const loadProducts = () =>
    fetch("/api/products?limit=200").then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : (d.products ?? []))).catch(() => {});

  useEffect(() => { if (editing) loadProducts(); }, [editing !== null]);

  const addProduct = (p: Product) => {
    if ((editing?.items ?? []).some(i => i.productId === p.id)) return;
    setEditing(prev => ({ ...prev, items: [...(prev?.items ?? []), { productId: p.id, role: "accessory", product: p }] }));
  };
  const removeItem = (pid: number) => setEditing(prev => ({ ...prev, items: (prev?.items ?? []).filter(i => i.productId !== pid) }));

  const save = async () => {
    if (!editing?.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const body = {
        name: editing.name, nameAr: editing.nameAr, occasion: editing.occasion,
        description: editing.description, coverImage: editing.coverImage, isPublished: editing.isPublished ?? false,
        items: (editing.items ?? []).map(i => ({ productId: i.productId, role: i.role })),
      };
      if (editing.id) {
        await fetch(`/api/outfits/${editing.id}`, { method: "PUT", headers: authH(), body: JSON.stringify(body) });
        toast.success("Outfit updated");
      } else {
        await fetch("/api/outfits", { method: "POST", headers: authH(), body: JSON.stringify(body) });
        toast.success("Outfit created");
      }
      setEditing(null); load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this outfit?")) return;
    await fetch(`/api/outfits/${id}`, { method: "DELETE", headers: authH() });
    toast.success("Deleted"); load();
  };

  const togglePublish = async (o: Outfit) => {
    await fetch(`/api/outfits/${o.id}`, { method: "PUT", headers: authH(), body: JSON.stringify({ isPublished: !o.isPublished }) });
    load();
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (editing !== null) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">{editing.id ? "Edit Outfit" : "New Outfit"}</h2>
        <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="text-xs font-medium mb-1 block">Name (EN)</label>
          <Input value={editing.name ?? ""} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} placeholder="Casual Summer Look" /></div>
        <div><label className="text-xs font-medium mb-1 block">Name (AR)</label>
          <Input value={editing.nameAr ?? ""} onChange={e => setEditing(p => ({ ...p, nameAr: e.target.value }))} placeholder="إطلالة صيفية" dir="rtl" /></div>
        <div><label className="text-xs font-medium mb-1 block">Occasion</label>
          <select className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
            value={editing.occasion ?? "casual"} onChange={e => setEditing(p => ({ ...p, occasion: e.target.value }))}>
            {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select></div>
        <div><label className="text-xs font-medium mb-1 block">Cover Image URL</label>
          <Input value={editing.coverImage ?? ""} onChange={e => setEditing(p => ({ ...p, coverImage: e.target.value }))} placeholder="https://..." /></div>
        <div className="sm:col-span-2"><label className="text-xs font-medium mb-1 block">Description</label>
          <Input value={editing.description ?? ""} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} placeholder="A romantic evening look..." /></div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={editing.isPublished ?? false}
          onChange={e => setEditing(p => ({ ...p, isPublished: e.target.checked }))} />
        <label htmlFor="pub" className="text-sm">Published</label>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products in Outfit ({(editing.items ?? []).length})</p>
        <div className="flex flex-wrap gap-2">
          {(editing.items ?? []).map(item => (
            <div key={item.productId} className="flex items-center gap-2 border border-border rounded-lg px-2 py-1.5 text-xs">
              {item.product?.images?.[0] && <img src={item.product.images[0]} className="w-6 h-6 rounded object-cover" />}
              <span className="max-w-[120px] truncate">{item.product?.name ?? `#${item.productId}`}</span>
              <button onClick={() => removeItem(item.productId)} className="text-rose-500 hover:text-rose-600"><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
        <Input placeholder="Search products to add..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {filteredProducts.slice(0, 20).map(p => (
            <button key={p.id} onClick={() => addProduct(p)}
              className="text-left p-2 rounded-lg border border-border hover:border-[#C9A96E]/50 transition-colors text-xs">
              {p.images?.[0] && <img src={p.images[0]} className="w-full aspect-square object-cover rounded mb-1" />}
              <span className="block truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#D4B87E] font-semibold">
        {saving ? "Saving…" : editing.id ? "Save Changes" : "Create Outfit"}
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{outfits.length} outfit{outfits.length !== 1 ? "s" : ""}</p>
        <Button onClick={openNew} size="sm" className="bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#D4B87E] font-semibold gap-1.5">
          <Plus size={14} /> New Outfit
        </Button>
      </div>
      {outfits.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={36} className="mx-auto mb-3 opacity-30" />
          <p>No outfits yet. Create your first curated look!</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {outfits.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="aspect-video bg-muted relative">
              {o.coverImage && <img src={o.coverImage} alt={o.name} className="w-full h-full object-cover" />}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${OCCASION_COLORS[o.occasion] ?? "bg-white/80"}`}>{o.occasion}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${o.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {o.isPublished ? "Live" : "Draft"}
                </span>
              </div>
            </div>
            <div className="p-3.5">
              <p className="font-semibold text-sm mb-1 truncate">{o.name}</p>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={() => openEdit(o)}><Pencil size={11} />Edit</Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => togglePublish(o)}>
                  {o.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-rose-500 hover:text-rose-600" onClick={() => del(o.id)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
