import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userStr = params.get("user");
    const error = params.get("error");

    if (error) {
      toast.error("Social login failed. Please try again or use email.");
      setLocation("/login");
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
        toast.success(`Welcome, ${user.name}!`);
        // Send to profile completion if new user
        if (!user.isProfileComplete) {
          setLocation("/complete-profile");
        } else {
          setLocation(user.role === "admin" ? "/admin" : "/");
        }
      } catch {
        toast.error("Login error. Please try again.");
        setLocation("/login");
      }
    } else {
      setLocation("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Completing sign in…</p>
      </div>
    </div>
  );
}
