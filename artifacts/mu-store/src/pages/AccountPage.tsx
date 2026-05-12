import { useLocation, Link } from "wouter";
import { Package, Heart, User, LogOut, ChevronRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useListOrders, useGetWishlist, getListOrdersQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ORDER_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, logout, user } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useListOrders({ query: { enabled: isLoggedIn, queryKey: getListOrdersQueryKey() } });
  const { data: wishlist, isLoading: wishlistLoading } = useGetWishlist({ query: { enabled: isLoggedIn, queryKey: getGetWishlistQueryKey() } });

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <User size={28} className="text-muted-foreground" />
        </div>
        <h2 className="font-serif text-2xl font-bold">Sign in to your account</h2>
        <p className="text-muted-foreground max-w-sm">Access your orders, wishlist and exclusive member benefits.</p>
        <Button asChild className="bg-foreground text-background hover:opacity-90 px-8" data-testid="button-login">
          <Link href="/login">Sign In</Link>
        </Button>
        <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-register">Create an account</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); setLocation("/"); toast.success("Signed out"); }} data-testid="button-logout">
          <LogOut size={16} className="mr-1.5" /> Sign Out
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: orders?.length ?? 0, icon: Package },
          { label: "Wishlist Items", value: wishlist?.length ?? 0, icon: Heart },
          { label: "Loyalty Points", value: user?.loyaltyPoints ?? 0, icon: Clock },
          { label: "Member Since", value: "2025", icon: User },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border rounded-xl p-4 text-center">
            <Icon size={20} className="mx-auto text-[#C9A96E] mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {ordersLoading
            ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            : !orders?.length
              ? (
                <div className="text-center py-12">
                  <Package size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">No orders yet</p>
                  <Button asChild variant="outline" size="sm" className="mt-3" data-testid="button-shop">
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              )
              : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-xl p-4 hover:border-foreground/30 transition-colors" data-testid={`order-${order.id}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-sm">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-muted"}`} data-testid={`status-order-${order.id}`}>
                          {order.status}
                        </span>
                      </div>
                      {/* Timeline */}
                      {order.status !== "cancelled" && (
                        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                          {ORDER_STEPS.map((s, i) => {
                            const curIdx = ORDER_STEPS.indexOf(order.status);
                            const done = i <= curIdx;
                            return (
                              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                                <div className={`w-2 h-2 rounded-full ${done ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                                {i < ORDER_STEPS.length - 1 && <div className={`w-6 h-px ${i < curIdx ? "bg-green-500" : "bg-muted-foreground/30"}`} />}
                              </div>
                            );
                          })}
                          <span className="text-xs text-muted-foreground ml-1 capitalize">{order.status}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{(order.items as any[]).length} item(s)</span>
                        <span className="font-bold">{order.total.toLocaleString()} EGP</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
        </TabsContent>

        <TabsContent value="wishlist">
          {wishlistLoading
            ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}</div>
            : !wishlist?.length
              ? (
                <div className="text-center py-12">
                  <Heart size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">Your wishlist is empty</p>
                  <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/products">Browse Products</Link></Button>
                </div>
              )
              : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wishlist.map(p => (
                    <Link key={p.id} href={`/products/${p.id}`} className="group" data-testid={`wishlist-product-${p.id}`}>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                        {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                      </div>
                      <p className="font-medium text-sm mt-2 leading-tight">{p.name}</p>
                      <p className="text-sm font-bold mt-0.5">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                    </Link>
                  ))}
                </div>
              )}
        </TabsContent>

        <TabsContent value="profile">
          <div className="max-w-md space-y-4">
            <div className="border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">Account Details</h3>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.phone && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Loyalty Points</p>
                <p className="font-medium text-[#C9A96E]">{user?.loyaltyPoints} pts</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
