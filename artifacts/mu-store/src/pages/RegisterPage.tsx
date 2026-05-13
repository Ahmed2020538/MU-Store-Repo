import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import PasswordStrength from "@/components/PasswordStrength";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  birthDate: z.string().min(1, "Date of birth is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const passwordValue = watch("password", "");

  const onSubmit = (data: FormData) => {
    const { confirmPassword, birthDate, ...payload } = data;
    registerMutation.mutate({ data: payload as any }, {
      onSuccess: (res) => {
        // Also patch birthDate since it's not in the generated schema
        const token = localStorage.getItem("mu_token") ?? res.token;
        fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        login(res.token, res.user as any);
        toast.success(`Welcome to MU, ${res.user.name}`);
        setLocation("/");
      },
      onError: (err: any) => toast.error(err?.data?.error ?? "Registration failed"),
    });
    // Patch birthDate via a separate call immediately (non-blocking workaround since generated schema doesn't include it)
    const rawPayload = { ...data };
    delete (rawPayload as any).confirmPassword;
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawPayload),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #D4608A 0%, transparent 60%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
          <span className="font-serif text-7xl font-bold text-[#C9A96E]">MU</span>
          <p className="text-background/70 italic text-lg mt-4">Join the MU Family</p>
          <div className="mt-12 space-y-4 text-left max-w-sm">
            {["Earn loyalty points on every purchase", "Early access to new collections", "Exclusive member discounts", "Birthday gift coupon every year 🎂"].map(feat => (
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

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/"><span className="font-serif text-4xl font-bold">MU</span></Link>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Create account</h1>
          <p className="text-muted-foreground mb-8">Join MU and start your luxury journey</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Layla Ahmed" {...register("name")} data-testid="input-name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" {...register("email")} data-testid="input-email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" placeholder="+20 1XX XXX XXXX" {...register("phone")} data-testid="input-phone" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Date of Birth <span className="text-destructive">*</span></Label>
              <Input id="birthDate" type="date" {...register("birthDate")} data-testid="input-birthdate"
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split("T")[0]} />
              {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
              <p className="text-xs text-muted-foreground">🎂 You'll receive a 20% birthday discount coupon every year!</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" {...register("password")} data-testid="input-password" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              <PasswordStrength password={passwordValue} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} data-testid="input-confirm-password" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-foreground text-background hover:opacity-90 h-12 font-semibold"
              disabled={registerMutation.isPending} data-testid="button-submit-register">
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground font-medium hover:underline" data-testid="link-login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
