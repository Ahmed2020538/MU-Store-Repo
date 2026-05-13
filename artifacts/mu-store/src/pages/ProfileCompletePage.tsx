import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, Gift, Zap, Star, ChevronRight, ChevronLeft, Check } from "lucide-react";

const GOVERNORATES = ["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","المنوفية","القليوبية","البحيرة","الغربية","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","شمال سيناء","جنوب سيناء","مطروح","الوادي الجديد"];

const STEPS = ["المعلومات الأساسية", "بيانات الموقع", "حسابات التواصل"];

export default function ProfileCompletePage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "", phone: user?.phone ?? "", birthDate: "",
    governorate: "", city: "", address: "",
    instagramHandle: "", facebookUrl: "", tiktokHandle: "", whatsappSocial: "", xHandle: "",
  });

  if (!isLoggedIn) { setLocation("/login"); return null; }

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleNext = () => {
    if (step === 0 && !form.name) { toast.error("الاسم مطلوب"); return; }
    if (step === 0 && !form.birthDate) { toast.error("تاريخ الميلاد مطلوب"); return; }
    if (step === 1 && !form.governorate) { toast.error("المحافظة مطلوبة"); return; }
    if (step < 2) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("mu_token");
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`🌟 أهلاً بك في نادي VIP! حصلتِ على ${data.bonusPoints} نقطة مكافأة`);
        setLocation("/account");
      } else {
        toast.error(data.error ?? "حدث خطأ");
      }
    } catch { toast.error("Request failed"); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress */}
        <div className="bg-[#C9A96E]/10 px-6 pt-6 pb-4">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${i <= step ? "text-[#C9A96E]" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${i < step ? "bg-[#C9A96E] border-[#C9A96E]" : i === step ? "border-[#C9A96E]" : "border-muted"}`}>
                  {i < step ? <Check size={12} className="text-foreground" /> : <span>{i + 1}</span>}
                </div>
                <span className="hidden sm:inline">{s}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#C9A96E] rounded-full" animate={{ width: `${((step + 1) / 3) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-serif text-2xl font-bold">المعلومات الأساسية</h2>
                <div className="space-y-1.5">
                  <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => u("name", e.target.value)} placeholder="ليلى أحمد" dir="rtl" />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الهاتف</Label>
                  <Input value={form.phone} onChange={e => u("phone", e.target.value)} placeholder="+20 1XX XXX XXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ الميلاد <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.birthDate} onChange={e => u("birthDate", e.target.value)}
                    max={new Date(Date.now() - 315576000000).toISOString().split("T")[0]} />
                  <p className="text-xs text-[#C9A96E] flex items-center gap-1"><Gift size={12} />ستحصلين على كوبون خصم خاص في عيد ميلادك كل عام!</p>
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-serif text-2xl font-bold">بيانات الموقع</h2>
                <div className="space-y-1.5">
                  <Label>المحافظة <span className="text-destructive">*</span></Label>
                  <select value={form.governorate} onChange={e => u("governorate", e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring" dir="rtl">
                    <option value="">اختري المحافظة</option>
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>المدينة</Label>
                  <Input value={form.city} onChange={e => u("city", e.target.value)} placeholder="مدينتك" dir="rtl" />
                </div>
                <div className="space-y-1.5">
                  <Label>العنوان التفصيلي (اختياري)</Label>
                  <Input value={form.address} onChange={e => u("address", e.target.value)} placeholder="الشارع، المبنى، الشقة…" dir="rtl" />
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* VIP card */}
                <div className="border-2 border-[#C9A96E] rounded-xl p-4 bg-[#C9A96E]/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={18} className="text-[#C9A96E]" />
                    <h3 className="font-bold text-[#C9A96E]">مزايا العضوة الأولوية 🌟</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                    {["وصول مبكر للعروض الحصرية 24 ساعة قبل الجميع","خصم 25% في عيد ميلادك","نقاط مكافأة مضاعفة على أول 3 طلبات","أكواد خصم حصرية طوال العام","أول من تعرف عن الكولكشنات الجديدة"].map(b => (
                      <li key={b} className="flex items-center gap-1.5"><Zap size={10} className="text-[#C9A96E] flex-shrink-0" />{b}</li>
                    ))}
                  </ul>
                </div>
                <h2 className="font-serif text-xl font-bold">ربط حسابات التواصل (اختياري)</h2>
                {[
                  { key: "instagramHandle", label: "Instagram", placeholder: "@username" },
                  { key: "facebookUrl", label: "Facebook", placeholder: "رابط الصفحة أو اسم المستخدم" },
                  { key: "tiktokHandle", label: "TikTok", placeholder: "@username" },
                  { key: "whatsappSocial", label: "WhatsApp", placeholder: "+201XXXXXXXXX" },
                  { key: "xHandle", label: "X (Twitter)", placeholder: "@username" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input value={(form as any)[key]} onChange={e => u(key, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ChevronLeft size={16} className="mr-1" />السابق
              </Button>
            )}
            {step === 2 && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSubmit} disabled={saving}>
                تخطي
              </Button>
            )}
            <Button onClick={handleNext} disabled={saving}
              className="flex-1 bg-foreground text-background hover:opacity-90 h-11 font-semibold">
              {saving ? "جاري الحفظ..." : step === 2 ? "إتمام الملف الشخصي ✨" : "التالي"}
              {step < 2 && <ChevronRight size={16} className="ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
