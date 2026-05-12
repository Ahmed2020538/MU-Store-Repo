import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, GripVertical, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const SIZES = ["35","36","37","38","39","40","41","42"];
const CATEGORIES = ["heels","flats","boots","bags","accessories"];

const schema = z.object({
  name: z.string().min(2),
  categorySlug: z.string().min(1),
  description: z.string().max(500).optional(),
  price: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional().or(z.literal("")),
  discountLabel: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  material: z.string().optional(),
  isSale: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isHidden: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface Props {
  product?: any;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminProductModal({ product, categories, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [selectedSizes, setSelectedSizes] = useState<string[]>(product?.sizes ?? []);
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [colorInput, setColorInput] = useState("");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      categorySlug: product?.categoryName?.toLowerCase() ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      salePrice: product?.salePrice ?? "",
      discountLabel: product?.discountLabel ?? "",
      stock: product?.stock ?? 0,
      material: product?.material ?? "",
      isSale: product?.isSale ?? false,
      isNew: product?.isNew ?? true,
      isFeatured: product?.isFeatured ?? false,
      isHidden: product?.isHidden ?? false,
    },
  });

  const isSale = watch("isSale");
  const price = watch("price");
  const salePrice = watch("salePrice");
  const discountPct = price && salePrice ? Math.round((1 - Number(salePrice) / Number(price)) * 100) : 0;

  const toggleSize = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addColor = () => { if (colorInput.trim()) { setColors(prev => [...prev, colorInput.trim()]); setColorInput(""); } };
  const removeColor = (i: number) => setColors(prev => prev.filter((_, idx) => idx !== i));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product?.id || !e.target.files?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(e.target.files).forEach(f => form.append("images", f));
    const token = localStorage.getItem("mu_token");
    try {
      const res = await fetch(`/api/products/${product.id}/images`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      setImages(data.images ?? []);
      toast.success("Images uploaded");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  };

  const removeImage = async (idx: number) => {
    if (!product?.id) { setImages(prev => prev.filter((_, i) => i !== idx)); return; }
    const token = localStorage.getItem("mu_token");
    const res = await fetch(`/api/products/${product.id}/images/${idx}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setImages(data.images ?? []);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const token = localStorage.getItem("mu_token");
    const cat = categories.find(c => c.slug === data.categorySlug);
    if (!cat) { toast.error("Invalid category"); setSaving(false); return; }
    const body = {
      name: data.name, description: data.description, price: data.price,
      salePrice: data.isSale && data.salePrice ? Number(data.salePrice) : null,
      discountLabel: data.discountLabel || null, categoryId: cat.id,
      sizes: selectedSizes, colors, stock: data.stock, material: data.material || null,
      isSale: data.isSale, isNew: data.isNew, isFeatured: data.isFeatured, isHidden: data.isHidden,
      images,
    };
    const url = isEdit ? `/api/products/${product.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Product updated" : "Product created");
      onSaved();
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif text-xl font-bold">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input {...register("name")} data-testid="input-product-name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <select {...register("categorySlug")} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm" data-testid="select-category">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
              {errors.categorySlug && <p className="text-xs text-destructive">Required</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (max 500 chars)</Label>
            <textarea {...register("description")} maxLength={500} rows={3} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" data-testid="textarea-description" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Original Price (EGP) *</Label>
              <Input type="number" step="0.01" {...register("price")} data-testid="input-price" />
            </div>
            <div className="space-y-1.5">
              <Label>Discount Price (EGP)</Label>
              <Input type="number" step="0.01" {...register("salePrice")} data-testid="input-sale-price" />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" {...register("stock")} data-testid="input-stock" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Discount Label</Label>
              <Input placeholder="e.g. Ramadan Sale" {...register("discountLabel")} data-testid="input-discount-label" />
            </div>
            {discountPct > 0 && <div className="flex items-end pb-2"><span className="text-sm text-[#D4608A] font-bold bg-[#D4608A]/10 px-3 py-1.5 rounded-full">خصم {discountPct}%</span></div>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "isSale", label: "Discount Active" },
              { key: "isNew", label: "New Arrival" },
              { key: "isFeatured", label: "Featured" },
              { key: "isHidden", label: "Hidden" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Switch id={key} checked={watch(key as any)} onCheckedChange={v => setValue(key as any, v)} data-testid={`switch-${key}`} />
                <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          <div>
            <Label className="mb-2 block">Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button type="button" key={s} onClick={() => toggleSize(s)}
                  className={`w-10 h-10 rounded-lg text-sm border-2 font-medium transition-colors ${selectedSizes.includes(s) ? "border-foreground bg-foreground text-background" : "border-border"}`}
                  data-testid={`size-${s}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Colors</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {colors.map((c, i) => (
                <span key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                  {c}<button type="button" onClick={() => removeColor(i)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="Add color (e.g. Champagne)" className="flex-1 text-sm" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }} data-testid="input-color" />
              <Button type="button" variant="outline" size="sm" onClick={addColor}><Plus size={14} /></Button>
            </div>
          </div>
          {isEdit && (
            <div>
              <Label className="mb-2 block">Images (max 5)</Label>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X size={16} className="text-white" />
                    </button>
                    {idx === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[10px] bg-foreground text-background py-0.5">Main</span>}
                  </div>
                ))}
              </div>
              {images.length < 5 && (
                <label className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-lg px-4 py-3 w-fit" data-testid="button-upload-images">
                  <Upload size={16} />{uploading ? "Uploading..." : "Upload images"}
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
          )}
          {!isEdit && <p className="text-xs text-muted-foreground">Images can be uploaded after creating the product.</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel-modal">Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#C9A96E] text-foreground hover:opacity-90 font-semibold" disabled={saving} data-testid="button-save-product">
              {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
