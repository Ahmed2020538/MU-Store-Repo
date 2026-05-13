import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { FaGoogle, FaFacebook, FaXTwitter, FaInstagram, FaApple } from "react-icons/fa6";

const schema = z.object({ email: z.string().email("Invalid email"), password: z.string().min(1, "Password required") });
type FormData = z.infer<typeof schema>;

const SOCIAL_LOGINS = [
  { key: "google", label: "Google", Icon: FaGoogle, color: "#DB4437", href: "/api/auth/google" },
  { key: "facebook", label: "Facebook", Icon: FaFacebook, color: "#1877F2", href: null },
  { key: "twitter", label: "X", Icon: FaXTwitter, color: "#000", href: null },
  { key: "instagram", label: "Instagram", Icon: FaInstagram, color: "#E1306C", href: null },
  { key: "apple", label: "Apple", Icon: FaApple, color: "#000", href: null },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

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
    if (provider.href) {
      window.location.href = provider.href;
    } else {
      toast.info(`${provider.label} login coming soon`);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C9A96E 0%, transparent 60%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
          <span className="font-serif text-7xl font-bold text-[#C9A96E]">MU</span>
          <p className="text-background/70 italic text-lg mt-4">Where Every Step Tells Your Story</p>
          <div className="mt-12 space-y-4 text-left max-w-sm">
            {["Free shipping on orders over 500 EGP", "Easy 14-day returns", "Premium Egyptian craftsmanship", "Birthday gift coupon every year 🎂"].map(feat => (
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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-4 text-center">
            <Link href="/"><span className="font-serif text-4xl font-bold">MU</span></Link>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold mb-1">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your MU account</p>
          </div>

          {/* Social login */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">Continue with</p>
            <div className="grid grid-cols-5 gap-2">
              {SOCIAL_LOGINS.map(s => (
                <motion.button key={s.key} whileHover={{ y: -2, scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialClick(s)} title={`Sign in with ${s.label}`}
                  className="h-11 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <s.Icon size={18} style={{ color: s.color }} />
                </motion.button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" {...register("email")} data-testid="input-email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} data-testid="input-password" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-foreground text-background hover:opacity-90 h-12 font-semibold"
              disabled={loginMutation.isPending} data-testid="button-submit-login">
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-foreground font-medium hover:underline" data-testid="link-register">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
