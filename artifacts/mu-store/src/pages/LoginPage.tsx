import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { FaGoogle, FaFacebook, FaXTwitter, FaInstagram, FaApple } from "react-icons/fa6";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

const SOCIAL_LOGINS = [
  { key: "google",    label: "Google",    Icon: FaGoogle,   color: "#DB4437", href: "/api/auth/google"    },
  { key: "facebook",  label: "Facebook",  Icon: FaFacebook, color: "#1877F2", href: "/api/auth/facebook"  },
  { key: "twitter",   label: "X",         Icon: FaXTwitter, color: "#000000", href: "/api/auth/twitter"   },
  { key: "instagram", label: "Instagram", Icon: FaInstagram,color: "#E1306C", href: "/api/auth/instagram" },
  { key: "apple",     label: "Apple",     Icon: FaApple,    color: "#000000", href: "/api/auth/apple"     },
];

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:    "Google sign-in is not configured yet.",
  facebook_not_configured:  "Facebook sign-in is not configured yet.",
  instagram_not_configured: "Instagram sign-in is not configured yet.",
  twitter_not_configured:   "X/Twitter sign-in is not configured yet.",
  apple_not_configured:     "Apple sign-in is not configured yet.",
  oauth_failed:             "Sign-in failed. Please try again or use email.",
  oauth_credentials_error:  "Sign-in is misconfigured. Please contact support or use email.",
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation();
  const loginMutation = useLogin();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Show toast for OAuth errors passed back via query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");
    if (errorCode) {
      toast.error(ERROR_MESSAGES[errorCode] ?? "Sign-in failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user as any);
        toast.success(`Welcome back, ${res.user.name}`);
        setLocation(res.user.role === "admin" ? "/admin" : "/");
      },
      onError: (err: any) => toast.error(err?.data?.error ?? "Invalid email or password"),
    });
  };

  const handleSocialClick = (provider: (typeof SOCIAL_LOGINS)[0]) => {
    setLoadingProvider(provider.key);
    window.location.href = provider.href;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C9A96E 0%, transparent 60%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
          <span className="font-serif text-7xl font-bold text-[#C9A96E]">MU</span>
          <p className="text-background/70 italic text-lg mt-4">{t("footer.tagline")}</p>
          <div className="mt-12 space-y-4 text-left max-w-sm">
            {[t("home.freeShipping"), t("home.easyReturns"), t("home.madeInEgypt"), "Birthday gift coupon every year 🎂"].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-background/70 text-sm">
                <div className="w-5 h-5 rounded-full bg-[#C9A96E]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C9A96E] text-xs">✓</span>
                </div>
                {feat}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-4 text-center">
            <Link href="/"><span className="font-serif text-4xl font-bold">MU</span></Link>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold mb-1">{t("auth.welcomeBack")}</h1>
            <p className="text-muted-foreground">{t("auth.signInAccount")}</p>
          </div>

          {/* Social login */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">{t("auth.continueWith")}</p>
            <div className="grid grid-cols-5 gap-2">
              {SOCIAL_LOGINS.map(s => {
                const isLoading = loadingProvider === s.key;
                return (
                  <motion.button
                    key={s.key}
                    whileHover={isLoading ? {} : { y: -2, scale: 1.05 }}
                    whileTap={isLoading ? {} : { scale: 0.95 }}
                    onClick={() => !loadingProvider && handleSocialClick(s)}
                    title={`Sign in with ${s.label}`}
                    disabled={!!loadingProvider}
                    className="h-11 rounded-xl border border-border flex flex-col items-center justify-center gap-0.5 hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? <Loader2 size={16} className="animate-spin text-muted-foreground" />
                      : <s.Icon size={18} style={{ color: s.color }} />
                    }
                    <span className="text-[9px] text-muted-foreground leading-none">{s.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.orWithEmail")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder="your@email.com" {...register("email")} data-testid="input-email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} data-testid="input-password" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-foreground text-background hover:opacity-90 h-12 font-semibold"
              disabled={loginMutation.isPending} data-testid="button-submit-login">
              {loginMutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-foreground font-medium hover:underline" data-testid="link-register">{t("auth.createOne")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
