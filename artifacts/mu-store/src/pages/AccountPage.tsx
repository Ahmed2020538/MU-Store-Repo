import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Package, Heart, User, LogOut, Clock, Ticket, Copy, Check, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useListOrders, useGetWishlist, getListOrdersQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp, FaXTwitter } from "react-icons/fa6";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800", shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};
const ORDER_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];

function CouponCard({ coupon }: { coupon: any }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  };
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  return (
    <div className={`border rounded-xl p-4 space-y-2 transition-opacity ${isExpired || coupon.used ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${coupon.source === "birthday" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
          {coupon.source === "birthday" ? "🎂 Birthday" : coupon.source}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${coupon.used ? "bg-blue-100 text-blue-700" : isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {coupon.used ? "Used" : isExpired ? "Expired" : "Active"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm font-mono tracking-wider">{coupon.code}</code>
        {!coupon.used && !isExpired && (
          <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0" onClick={copy}>
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-[#C9A96E]">{coupon.discountPercent}% off</span>
        {coupon.expiresAt && ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
      </p>
    </div>
  );
}

const SOCIAL_FIELDS = [
  { key: "instagramHandle", label: "Instagram", Icon: FaInstagram, color: "#E1306C", buildUrl: (v: string) => `https://instagram.com/${v.replace("@", "")}` },
  { key: "facebookUrl", label: "Facebook", Icon: FaFacebook, color: "#1877F2", buildUrl: (v: string) => v.startsWith("http") ? v : `https://facebook.com/${v}` },
  { key: "tiktokHandle", label: "TikTok", Icon: FaTiktok, color: "#010101", buildUrl: (v: string) => `https://tiktok.com/@${v.replace("@", "")}` },
  { key: "whatsappSocial", label: "WhatsApp", Icon: FaWhatsapp, color: "#25D366", buildUrl: (v: string) => `https://wa.me/${v.replace(/\D/g, "")}` },
  { key: "xHandle", label: "X (Twitter)", Icon: FaXTwitter, color: "#000", buildUrl: (v: string) => `https://x.com/${v.replace("@", "")}` },
];

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, logout, user } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useListOrders({ query: { enabled: isLoggedIn, queryKey: getListOrdersQueryKey() } });
  const { data: wishlist, isLoading: wishlistLoading } = useGetWishlist({ query: { enabled: isLoggedIn, queryKey: getGetWishlistQueryKey() } });
  const [coupons, setCoupons] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("mu_token");
    const h = { headers: { Authorization: `Bearer ${token}` } };
    fetch("/api/coupons/mine", h).then(r => r.json()).then(setCoupons).catch(() => {});
    fetch("/api/auth/me", h).then(r => r.json()).then(setProfile).catch(() => {});
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><User size={28} className="text-muted-foreground" /></div>
        <h2 className="font-serif text-2xl font-bold">Sign in to your account</h2>
        <p className="text-muted-foreground max-w-sm">Access your orders, wishlist and exclusive member benefits.</p>
        <Button asChild className="bg-foreground text-background hover:opacity-90 px-8" data-testid="button-login"><Link href="/login">Sign In</Link></Button>
        <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-register">Create an account</Link>
      </div>
    );
  }

  const activeCoupons = coupons.filter(c => c.isActive);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[#C9A96E]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
              <User size={24} className="text-[#C9A96E]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold">{user?.name}</h1>
              {profile?.isPriority ? <span className="flex items-center gap-1 text-xs bg-[#C9A96E]/10 text-[#C9A96E] px-2 py-0.5 rounded-full font-medium"><Crown size={10} />VIP</span> : null}
            </div>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); setLocation("/"); toast.success("Signed out"); }} data-testid="button-logout">
          <LogOut size={16} className="mr-1.5" />Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: orders?.length ?? 0, icon: Package },
          { label: "Wishlist", value: wishlist?.length ?? 0, icon: Heart },
          { label: "Loyalty Points", value: user?.loyaltyPoints ?? 0, icon: Clock },
          { label: "Active Coupons", value: activeCoupons.length, icon: Ticket },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border rounded-xl p-4 text-center">
            <Icon size={20} className="mx-auto text-[#C9A96E] mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-6 flex-wrap gap-1">
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="coupons">كوبوناتي {activeCoupons.length > 0 && <span className="ml-1 bg-[#C9A96E] text-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeCoupons.length}</span>}</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {ordersLoading
            ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            : !orders?.length
              ? <div className="text-center py-12"><Package size={36} className="mx-auto text-muted-foreground/40 mb-3" /><p className="font-medium">No orders yet</p><Button asChild variant="outline" size="sm" className="mt-3" data-testid="button-shop"><Link href="/products">Start Shopping</Link></Button></div>
              : <div className="space-y-4">
                  {orders.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-xl p-4 hover:border-foreground/30 transition-colors" data-testid={`order-${order.id}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-sm">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? "bg-muted"}`} data-testid={`status-order-${order.id}`}>{order.status}</span>
                      </div>
                      {order.status !== "cancelled" && (
                        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                          {ORDER_STEPS.map((s, i) => {
                            const curIdx = ORDER_STEPS.indexOf(order.status);
                            return (
                              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                                <div className={`w-2 h-2 rounded-full ${i <= curIdx ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                                {i < ORDER_STEPS.length - 1 && <div className={`w-6 h-px ${i < curIdx ? "bg-green-500" : "bg-muted-foreground/30"}`} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{(order.items as any[]).length} item(s)</span>
                        <span className="font-bold">{order.total.toLocaleString()} EGP</span>
                      </div>
                    </motion.div>
                  ))}
                </div>}
        </TabsContent>

        <TabsContent value="wishlist">
          {wishlistLoading
            ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}</div>
            : !wishlist?.length
              ? <div className="text-center py-12"><Heart size={36} className="mx-auto text-muted-foreground/40 mb-3" /><p className="font-medium">Your wishlist is empty</p><Button asChild variant="outline" size="sm" className="mt-3"><Link href="/products">Browse Products</Link></Button></div>
              : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wishlist.map(p => (
                    <Link key={p.id} href={`/products/${p.id}`} className="group" data-testid={`wishlist-product-${p.id}`}>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                        {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                      </div>
                      <p className="font-medium text-sm mt-2 leading-tight">{p.name}</p>
                      <p className="text-sm font-bold mt-0.5">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                    </Link>
                  ))}
                </div>}
        </TabsContent>

        <TabsContent value="coupons">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">كوبوناتي</h3>
              {!profile?.isProfileComplete && (
                <Link href="/complete-profile">
                  <Button size="sm" variant="outline" className="text-[#C9A96E] border-[#C9A96E]/30">
                    <Crown size={14} className="mr-1.5" />أكملي ملفك للحصول على مزايا VIP
                  </Button>
                </Link>
              )}
            </div>
            {!coupons.length
              ? <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Ticket size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium">لا يوجد كوبونات بعد</p>
                  <p className="text-xs text-muted-foreground mt-1">ستحصلين على كوبون خصم 20% في عيد ميلادك 🎂</p>
                </div>
              : <div className="grid sm:grid-cols-2 gap-4">
                  {coupons.map(c => <CouponCard key={c.id} coupon={c} />)}
                </div>}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="max-w-md space-y-4">
            <div className="border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold">Account Details</h3>
              {[
                { label: "Full Name", value: user?.name },
                { label: "Email", value: user?.email },
                { label: "Phone", value: user?.phone },
                { label: "Loyalty Points", value: `${user?.loyaltyPoints ?? 0} pts` },
                { label: "Governorate", value: profile?.governorate },
                { label: "City", value: profile?.city },
              ].map(({ label, value }) => value ? (
                <div key={label} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-sm">{value}</p>
                </div>
              ) : null)}
            </div>

            {/* Social accounts */}
            <div className="border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold">Connected Social Accounts</h3>
              {SOCIAL_FIELDS.map(({ key, label, Icon, color, buildUrl }) => {
                const value = profile?.[key];
                return (
                  <div key={key} className="flex items-center gap-3 py-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${value ? "" : "opacity-30"}`} style={{ backgroundColor: color }}>
                      <Icon size={14} color="#fff" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{label}</p>
                      {value
                        ? <a href={buildUrl(value)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A96E] hover:underline truncate block">{value}</a>
                        : <p className="text-xs text-muted-foreground">Not connected</p>}
                    </div>
                  </div>
                );
              })}
              <Link href="/complete-profile">
                <Button variant="outline" size="sm" className="w-full mt-2">Edit Social Accounts</Button>
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
