import "./i18n";
import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import { SearchProvider } from "@/lib/search-context";
import { NotificationProvider } from "@/lib/notification-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchModal from "@/components/SearchModal";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import HelpWidget from "@/components/HelpWidget";
import ScrollProgress from "@/components/ScrollProgress";
import PremiumCursor from "@/components/PremiumCursor";
import CookieBanner from "@/components/CookieBanner";
import ErrorBoundary from "@/components/ErrorBoundary";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const SizeGuidePage = lazy(() => import("@/pages/SizeGuidePage"));
const ShippingPolicyPage = lazy(() => import("@/pages/ShippingPolicyPage"));
const ReturnsPolicyPage = lazy(() => import("@/pages/ReturnsPolicyPage"));
const LookbookPage = lazy(() => import("@/pages/LookbookPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const ProfileCompletePage = lazy(() => import("@/pages/ProfileCompletePage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const SavedLooksPage = lazy(() => import("@/pages/SavedLooksPage"));
const FashionFeedPage = lazy(() => import("@/pages/FashionFeedPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "An error occurred";
        console.error("[mutation error]", msg);
      },
    },
  },
});

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 rounded-full border-2 border-[#C9A96E] border-t-transparent animate-spin" />
    </div>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <PremiumCursor />
      <Navbar />
      <CartDrawer />
      <SearchModal />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/products" component={ProductsPage} />
            <Route path="/products/:id" component={ProductDetailPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/account" component={AccountPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/size-guide" component={SizeGuidePage} />
            <Route path="/shipping" component={ShippingPolicyPage} />
            <Route path="/returns" component={ReturnsPolicyPage} />
            <Route path="/lookbook" component={LookbookPage} />
            <Route path="/saved-looks" component={SavedLooksPage} />
            <Route path="/feed" component={FashionFeedPage} />
            <Route path="/privacy" component={PrivacyPolicyPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFAB />
      <HelpWidget />
      <CookieBanner />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/auth-callback" component={AuthCallbackPage} />
        <Route path="/complete-profile" component={ProfileCompletePage} />
        <Route component={AppLayout} />
      </Switch>
    </Suspense>
  );
}

function LanguageGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <SearchProvider>
                  <TooltipProvider>
                    <LanguageGate>
                      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                        <Router />
                      </WouterRouter>
                    </LanguageGate>
                    <Toaster richColors position="top-right" />
                  </TooltipProvider>
                </SearchProvider>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
