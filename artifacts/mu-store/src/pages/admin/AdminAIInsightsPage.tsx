import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, AlertTriangle, Lightbulb, Package, DollarSign, ShoppingBag, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Insights {
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { id: number; name: string; revenue: number; sold: number; stock: number }[];
  lowStock: { id: number; name: string; stock: number; price: number }[];
}

function derive_suggestions(data: Insights): { icon: typeof TrendingUp; color: string; text: string }[] {
  const tips: { icon: typeof TrendingUp; color: string; text: string }[] = [];
  const outOfStock = data.lowStock.filter(p => p.stock === 0);
  const criticalStock = data.lowStock.filter(p => p.stock > 0 && p.stock < 5);
  const topSeller = data.topProducts[0];

  if (outOfStock.length > 0)
    tips.push({ icon: AlertTriangle, color: "text-red-500", text: `${outOfStock.length} product${outOfStock.length > 1 ? "s" : ""} out of stock — restock ${outOfStock.slice(0, 2).map(p => `"${p.name}"`).join(" and ")} immediately to avoid lost sales.` });
  if (criticalStock.length > 0)
    tips.push({ icon: AlertTriangle, color: "text-amber-500", text: `${criticalStock.length} products have fewer than 5 units left — schedule restocking for ${criticalStock[0].name}.` });
  if (topSeller)
    tips.push({ icon: TrendingUp, color: "text-green-600", text: `"${topSeller.name}" is your top revenue driver (${topSeller.revenue.toLocaleString()} EGP). Promote it in your homepage banner to maximize conversion.` });

  const recent7 = data.revenueByDay.slice(-7);
  const prev7 = data.revenueByDay.slice(-14, -7);
  const recentAvg = recent7.reduce((a, b) => a + b.revenue, 0) / Math.max(recent7.length, 1);
  const prevAvg = prev7.reduce((a, b) => a + b.revenue, 0) / Math.max(prev7.length, 1);
  if (recentAvg < prevAvg * 0.9 && prevAvg > 0)
    tips.push({ icon: TrendingUp, color: "text-blue-500", text: `Revenue is down ~${Math.round((1 - recentAvg / prevAvg) * 100)}% vs. the previous week. Consider activating a flash sale or email campaign.` });
  else if (recentAvg > prevAvg * 1.1 && prevAvg > 0)
    tips.push({ icon: TrendingUp, color: "text-green-500", text: `Revenue is up ~${Math.round((recentAvg / prevAvg - 1) * 100)}% vs. last week. Double down on whatever is working — amplify ads or promotions.` });

  if (tips.length === 0)
    tips.push({ icon: Lightbulb, color: "text-[#C9A96E]", text: "Place more orders to unlock AI-driven business insights and revenue optimization suggestions." });

  return tips;
}

export default function AdminAIInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mu_token");
    fetch("/api/admin/insights", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!data) return <p className="text-muted-foreground text-sm">Failed to load insights.</p>;

  const suggestions = derive_suggestions(data);
  const totalRecentRevenue = data.revenueByDay.slice(-30).reduce((a, b) => a + b.revenue, 0);
  const totalRecentOrders = data.revenueByDay.slice(-30).reduce((a, b) => a + b.orders, 0);
  const avgOrder = totalRecentOrders > 0 ? totalRecentRevenue / totalRecentOrders : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: "30-Day Revenue", value: `${totalRecentRevenue.toLocaleString()} EGP` },
          { icon: ShoppingBag, label: "30-Day Orders", value: totalRecentOrders },
          { icon: Package, label: "Avg. Order Value", value: `${Math.round(avgOrder).toLocaleString()} EGP` },
        ].map(({ icon: Icon, label, value }) => (
          <motion.div key={label} whileHover={{ y: -2 }}
            className="border border-border rounded-xl p-4 bg-card flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-[#C9A96E]" />
            </div>
            <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold mt-0.5">{value}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Revenue trend */}
      {data.revenueByDay.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-[#C9A96E]" /> Revenue Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} EGP`, "Revenue"]} labelFormatter={l => `Date: ${l}`} />
              <Line type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top products */}
      {data.topProducts.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Package size={15} className="text-[#C9A96E]" /> Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} EGP`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#C9A96E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border overflow-hidden">
            {data.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-5 text-xs text-muted-foreground font-semibold">#{i + 1}</span>
                <span className="flex-1 font-medium truncate">{p.name}</span>
                <span className="text-[#C9A96E] font-semibold">{p.revenue.toLocaleString()} EGP</span>
                <span className="text-xs text-muted-foreground">{p.sold} sold</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-700" : p.stock < 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-900 rounded-xl p-5 bg-amber-50 dark:bg-amber-950/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <AlertTriangle size={15} /> Low Stock Alerts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                <Package size={13} className={p.stock === 0 ? "text-red-500" : "text-amber-500"} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className={`text-[10px] font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} remaining`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles size={15} className="text-[#C9A96E]" /> AI Recommendations
        </h3>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border">
              <s.icon size={15} className={`${s.color} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
