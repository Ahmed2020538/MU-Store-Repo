import { useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Users, ShoppingBag, DollarSign, Edit, Trash2, Plus, Settings } from "lucide-react";
import { motion } from "framer-motion";
import {
  useAdminDashboard, useAdminListOrders, useAdminListCustomers,
  useListProducts, useAdminUpdateOrderStatus,
  useDeleteProduct, getAdminDashboardQueryKey, getAdminListOrdersQueryKey,
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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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

  const { data: dashboard, isLoading: dashLoading } = useAdminDashboard({ query: { enabled: isAdmin, queryKey: getAdminDashboardQueryKey() } });
  const { data: orders, isLoading: ordersLoading } = useAdminListOrders({ query: { enabled: isAdmin, queryKey: getAdminListOrdersQueryKey() } });
  const { data: customers, isLoading: customersLoading } = useAdminListCustomers({ query: { enabled: isAdmin, queryKey: getAdminListCustomersQueryKey() } });
  const { data: productsData, isLoading: productsLoading } = useListProducts({ limit: 100 }, { query: { enabled: isAdmin, queryKey: getListProductsQueryKey({ limit: 100 }) } });
  const { data: categoriesData } = useListCategories({ query: { enabled: isAdmin, queryKey: getListCategoriesQueryKey() } });

  const updateStatus = useAdminUpdateOrderStatus();
  const deleteProduct = useDeleteProduct();

  if (!isLoggedIn) { setLocation("/login"); return null; }
  if (!isAdmin) {
    return <div className="text-center py-24"><p className="text-lg font-medium">Access denied</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/")}><a>Go Home</a></Button></div>;
  }

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate({ id: orderId, data: { status: status as any } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() }); toast.success("Status updated"); },
      onError: () => toast.error("Failed to update status"),
    });
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast.success("Product deleted"); },
      onError: () => toast.error("Failed to delete product"),
    });
  };

  const handleProductSaved = () => {
    setProductModal({ open: false });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
  };

  const categories = (categoriesData as any[] | undefined) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">MU Store management panel</p>
      </div>

      {dashLoading
        ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard label="Total Revenue" value={`${(dashboard?.totalRevenue ?? 0).toLocaleString()} EGP`} icon={DollarSign} />
            <KPICard label="Total Orders" value={dashboard?.totalOrders ?? 0} icon={ShoppingBag} sub={`${dashboard?.ordersToday ?? 0} today`} />
            <KPICard label="Products" value={dashboard?.totalProducts ?? 0} icon={Package} />
            <KPICard label="Customers" value={dashboard?.totalCustomers ?? 0} icon={Users} />
          </div>
        )}

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
        <TabsList className="mb-6 flex-wrap gap-1">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings"><Settings size={14} className="mr-1.5 inline" />Settings</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Order", "Customer", "Items", "Total", "COD", "Status", "Date", "Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ordersLoading
                    ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={8}><Skeleton className="h-12 m-2 rounded" /></td></tr>)
                    : (orders ?? []).map((order: any) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-order-${order.id}`}>
                        <td className="px-4 py-3 font-medium">#{order.id}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{order.fullName ?? "—"}</td>
                        <td className="px-4 py-3">{(order.items as any[]).length}</td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{order.total.toLocaleString()} EGP</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {order.paymentMethod === "cod" ? (
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${order.codDownPaymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                  Down: {order.codDownPayment?.toLocaleString()} EGP
                                </span>
                              </div>
                              <p className="text-muted-foreground">Due: {order.amountDueOnDelivery?.toLocaleString()} EGP</p>
                            </div>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                            className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none" data-testid={`select-order-status-${order.id}`}>
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setProductModal({ open: true })} className="bg-foreground text-background hover:opacity-90" size="sm" data-testid="button-add-product">
              <Plus size={16} className="mr-1.5" /> Add Product
            </Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Product", "Category", "Price", "Stock", "Status", "Sales", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productsLoading
                    ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={7}><Skeleton className="h-12 m-2 rounded" /></td></tr>)
                    : (productsData?.products ?? []).map((p: any) => (
                      <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${p.isHidden ? "opacity-50" : ""}`} data-testid={`row-product-${p.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images[0] && <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                            <div>
                              <span className="font-medium leading-tight max-w-[140px] truncate block">{p.name}</span>
                              {p.discountLabel && <span className="text-[10px] bg-[#D4608A]/10 text-[#D4608A] px-1.5 rounded-full">{p.discountLabel}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.categoryName ?? "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {p.salePrice ? <><span className="font-bold text-[#D4608A]">{p.salePrice.toLocaleString()}</span><span className="text-xs text-muted-foreground line-through ml-1">{p.price.toLocaleString()}</span></> : <span>{p.price.toLocaleString()} EGP</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={p.stock <= 3 ? "text-amber-600 font-medium" : ""}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.isNew && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">New</span>}
                            {p.isFeatured && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Featured</span>}
                            {p.isSale && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">Sale</span>}
                            {p.isHidden && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">Hidden</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.soldCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProductModal({ open: true, product: p })} data-testid={`button-edit-product-${p.id}`}><Edit size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(p.id, p.name)} data-testid={`button-delete-product-${p.id}`}><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Customers */}
        <TabsContent value="customers">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Name", "Email", "Phone", "Points", "Role", "Joined"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customersLoading
                    ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={6}><Skeleton className="h-12 m-2 rounded" /></td></tr>)
                    : (customers ?? []).map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/30" data-testid={`row-customer-${c.id}`}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                        <td className="px-4 py-3">{c.loyaltyPoints}</td>
                        <td className="px-4 py-3 capitalize"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>{c.role}</span></td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <AdminContactPage />
        </TabsContent>
      </Tabs>

      {productModal.open && (
        <AdminProductModal
          product={productModal.product}
          categories={categories}
          onClose={() => setProductModal({ open: false })}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}
