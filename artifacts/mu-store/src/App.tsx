import "./i18n";
import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import HelpWidget from "@/components/HelpWidget";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AccountPage from "@/pages/AccountPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminPage from "@/pages/AdminPage";
import ContactPage from "@/pages/ContactPage";
import SizeGuidePage from "@/pages/SizeGuidePage";
import ShippingPolicyPage from "@/pages/ShippingPolicyPage";
import ReturnsPolicyPage from "@/pages/ReturnsPolicyPage";
import ProfileCompletePage from "@/pages/ProfileCompletePage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import LanguageSelectPage from "@/pages/LanguageSelectPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
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
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <WhatsAppFAB />
      <HelpWidget />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/auth-callback" component={AuthCallbackPage} />
      <Route path="/complete-profile" component={ProfileCompletePage} />
      <Route component={AppLayout} />
    </Switch>
  );
}

function LanguageGate({ children }: { children: React.ReactNode }) {
  const [langChosen, setLangChosen] = useState(() => !!localStorage.getItem("mu_language"));
  if (!langChosen) {
    return <LanguageSelectPage onSelect={() => setLangChosen(true)} />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <LanguageGate>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
              </LanguageGate>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
