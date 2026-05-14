import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Users, ShoppingBag, DollarSign, Edit, Trash2, Plus, Settings, ShieldCheck, Mail, Ticket, Crown, Tag, Star, Share2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  useAdminDashboard, useAdminListOrders, useAdminListCustomers,
  useListProducts, useAdminUpdateOrderStatus, useDeleteProduct,
  getAdminDashboardQueryKey, getAdminListOrdersQueryKey,
  getAdminListCustomersQueryKey, getListProductsQueryKey, useListCategories,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AdminProductModal from "./admin/AdminProductModal";
import AdminContactPage from "./admin/AdminContactPage";
import AdminAdminsPage from "./admin/AdminAdminsPage";
import AdminMessagesPage from "./admin/AdminMessagesPage";
import AdminCouponsPage from "./admin/AdminCouponsPage";
import AdminBrandsPage from "./admin/AdminBrandsPage";
import AdminTestimonialsPage from "./admin/AdminTestimonialsPage";
import AdminSocialPage from "./admin/AdminSocialPage";
import AdminAIInsightsPage from "./admin/AdminAIInsightsPage";
import AdminHeroPage from "./admin/AdminHeroPage";
import AdminOutfitsPage from "./admin/AdminOutfitsPage";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800", shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};
const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

function KPICard({ label, value, icon: Icon, sub }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="border border-border rounded-xl p-5 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
          <Icon size={20} className="text-[#C9A96E]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { isAdmin, isLoggedIn } = useAuth();
  const qc = useQueryClient();
  const [productModal, setProductModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [priorityFilter, setPriorityFilter] = useState(false);

  const { data: dashboard, isLoading: dashLoading } = useAdminDashboard({ query: { enabled: isAdmin, queryKey: getAdminDashboardQueryKey() } });
  const { data: orders, isLoading: ordersLoading } = useAdminListOrders({ query: { enabled: isAdmin, queryKey: getAdminListOrdersQueryKey() } });
  const { data: customers, isLoading: customersLoading } = useAdminListCustomers({ query: { enabled: isAdmin, queryKey: getAdminListCustomersQueryKey() } });
  const { data: productsData, isLoading: productsLoading } = useListProducts({ limit: 100 }, { query: { enabled: isAdmin, queryKey: getListProductsQueryKey({ limit: 100 }) } });
  const { data: categoriesData } = useListCategories({ query: { enabled: isAdmin, queryKey: getListCategoriesQueryKey() } });

  const updateStatus = useAdminUpdateOrderStatus();
  const deleteProduct = useDeleteProduct();

  if (!isLoggedIn) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="text-center py-24"><p className="text-lg font-medium">Access denied</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>Go Home</Button></div>;

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate({ id: orderId, data: { status: status as any } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() }); toast.success("Status updated"); },
      onError: () => toast.error("Failed"),
    });
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast.success("Deleted"); },
      onError: () => toast.error("Failed"),
    });
  };

  const handlePriorityToggle = async (customerId: number) => {
    const token = localStorage.getItem("mu_token");
    const r = await fetch(`/api/admin/customers/${customerId}/priority`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { qc.invalidateQueries({ queryKey: getAdminListCustomersQueryKey() }); toast.success("Priority updated"); }
    else toast.error("Failed");
  };

  const categories = (categoriesData as any[] | undefined) ?? [];
  const visibleCustomers = priorityFilter ? (customers ?? []).filter((c: any) => c.isPriority) : (customers ?? []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8"><h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1><p className="text-muted-foreground mt-1">MU Store management panel</p></div>

      {dashLoading
        ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        : <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard label="Total Revenue" value={`${(dashboard?.totalRevenue ?? 0).toLocaleString()} EGP`} icon={DollarSign} />
            <KPICard label="Total Orders" value={dashboard?.totalOrders ?? 0} icon={ShoppingBag} sub={`${dashboard?.ordersToday ?? 0} today`} />
            <KPICard label="Products" value={dashboard?.totalProducts ?? 0} icon={Package} />
            <KPICard label="Customers" value={dashboard?.totalCustomers ?? 0} icon={Users} sub={(dashboard as any)?.priorityCount ? `${(dashboard as any).priorityCount} VIP` : undefined} />
          </div>}

      {dashboard?.revenueByCategory && dashboard.revenueByCategory.length > 0 && (
        <div className="border border-border rounded-xl p-5 mb-8">
          <h3 className="font-semibold mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboard.revenueByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} EGP`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#C9A96E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Tabs defaultValue="orders">
        <TabsList className="mb-6 flex-wrap gap-1 h-auto">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="brands"><Tag size={13} className="mr-1 inline" />Brands</TabsTrigger>
          <TabsTrigger value="testimonials"><Star size={13} className="mr-1 inline" />Reviews</TabsTrigger>
          <TabsTrigger value="coupons"><Ticket size={13} className="mr-1 inline" />Coupons</TabsTrigger>
          <TabsTrigger value="messages"><Mail size={13} className="mr-1 inline" />Messages</TabsTrigger>
          <TabsTrigger value="admins"><ShieldCheck size={13} className="mr-1 inline" />Admins</TabsTrigger>
          <TabsTrigger value="social"><Share2 size={13} className="mr-1 inline" />Social</TabsTrigger>
          <TabsTrigger value="settings"><Settings size={13} className="mr-1 inline" />Settings</TabsTrigger>
          <TabsTrigger value="insights"><Sparkles size={13} className="mr-1 inline" />AI Insights</TabsTrigger>
          <TabsTrigger value="hero"><Sparkles size={13} className="mr-1 inline" />Hero</TabsTrigger>
          <TabsTrigger value="outfits"><Sparkles size={13} className="mr-1 inline" />Outfits</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>{["Order","Customer","Items","Total","Status","Date","Action"].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {ordersLoading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={7}><Skeleton className="h-12 m-2 rounded" /></td></tr>)
                  : (orders ?? []).map((order: any) => (
                    <tr key={order.id} className="hover:bg-muted/30" data-testid={`row-order-${order.id}`}>
                      <td className="px-4 py-3 font-medium">#{order.id}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{order.fullName ?? "—"}</td>
                      <td className="px-4 py-3">{(order.items as any[]).length}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{order.total.toLocaleString()} EGP</td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>{order.status}</span></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} className="text-xs border border-border rounded px-2 py-1 bg-background" data-testid={`select-order-status-${order.id}`}>{ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="flex justify-end mb-4"><Button onClick={() => setProductModal({ open: true })} className="bg-foreground text-background hover:opacity-90" size="sm" data-testid="button-add-product"><Plus size={16} className="mr-1.5" />Add Product</Button></div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>{["Product","Category","Price","Stock","Status","Sales","Actions"].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {productsLoading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={7}><Skeleton className="h-12 m-2 rounded" /></td></tr>)
                  : (productsData?.products ?? []).map((p: any) => (
                    <tr key={p.id} className={`hover:bg-muted/30 ${p.isHidden ? "opacity-50" : ""}`} data-testid={`row-product-${p.id}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3">{p.images[0] && <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}<span className="font-medium max-w-[140px] truncate">{p.name}</span></div></td>
                      <td className="px-4 py-3 text-muted-foreground">{p.categoryName ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.salePrice ? <><span className="font-bold text-[#D4608A]">{p.salePrice.toLocaleString()}</span><span className="text-xs text-muted-foreground line-through ml-1">{p.price.toLocaleString()}</span></> : `${p.price.toLocaleString()} EGP`}</td>
                      <td className="px-4 py-3"><span className={p.stock <= 3 ? "text-amber-600 font-medium" : ""}>{p.stock}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{p.isNew && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">New</span>}{p.isFeatured && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Featured</span>}{p.isSale && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">Sale</span>}</div></td>
                      <td className="px-4 py-3 text-muted-foreground">{p.soldCount}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProductModal({ open: true, product: p })} data-testid={`button-edit-product-${p.id}`}><Edit size={14} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(p.id, p.name)} data-testid={`button-delete-product-${p.id}`}><Trash2 size={14} /></Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setPriorityFilter(v => !v)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${priorityFilter ? "bg-[#C9A96E] text-foreground border-[#C9A96E]" : "border-border hover:bg-muted"}`}><Crown size={12} />{priorityFilter ? "Showing VIP only" : "Filter VIP"}</button>
            <span className="text-xs text-muted-foreground">{visibleCustomers.length} customers</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>{["Name","Email","Phone","Points","Role","VIP","Joined",""].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {customersLoading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={8}><Skeleton className="h-12 m-2 rounded" /></td></tr>)
                  : visibleCustomers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-muted/30" data-testid={`row-customer-${c.id}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2">{c.isPriority ? <Crown size={12} className="text-[#C9A96E] flex-shrink-0" /> : null}<span className="font-medium">{c.name}</span></div></td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                      <td className="px-4 py-3">{c.loyaltyPoints}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>{c.role}</span></td>
                      <td className="px-4 py-3"><button onClick={() => handlePriorityToggle(c.id)} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${c.isPriority ? "bg-[#C9A96E]/20 text-[#C9A96E] hover:bg-[#C9A96E]/30" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{c.isPriority ? "⭐ VIP" : "Regular"}</button></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brands"><AdminBrandsPage /></TabsContent>
        <TabsContent value="testimonials"><AdminTestimonialsPage /></TabsContent>
        <TabsContent value="coupons"><AdminCouponsPage /></TabsContent>
        <TabsContent value="messages"><AdminMessagesPage /></TabsContent>
        <TabsContent value="admins"><AdminAdminsPage /></TabsContent>
        <TabsContent value="social"><AdminSocialPage /></TabsContent>
        <TabsContent value="settings"><AdminContactPage /></TabsContent>
        <TabsContent value="insights"><AdminAIInsightsPage /></TabsContent>
        <TabsContent value="hero"><AdminHeroPage /></TabsContent>
        <TabsContent value="outfits"><AdminOutfitsPage /></TabsContent>
      </Tabs>

      {productModal.open && (
        <AdminProductModal product={productModal.product} categories={categories}
          onClose={() => setProductModal({ open: false })}
          onSaved={() => { setProductModal({ open: false }); qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); }} />
      )}
    </div>
  );
}
