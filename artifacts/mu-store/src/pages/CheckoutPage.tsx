import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Package, CreditCard, FileText } from "lucide-react";
import { useCreateOrder, useValidatePromo } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const GOVERNORATES = ["Cairo","Giza","Alexandria","Dakahlia","Red Sea","Beheira","Fayoum","Gharbiya","Ismailia","Menofia","Minya","Qaliubiya","New Valley","Suez","Aswan","Assiut","Beni Suef","Port Said","Damietta","Sharqia","South Sinai","Kafr El Sheikh","Matrouh","Luxor","Qena","Sohag","North Sinai"];

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, Meeza" },
  { id: "fawry", label: "Fawry", sub: "Pay at any Fawry outlet" },
  { id: "cod", label: "Cash on Delivery", sub: "20 EGP additional fee" },
  { id: "vodafone", label: "Vodafone Cash", sub: "Mobile wallet payment" },
];

const deliverySchema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().min(11, "Enter valid phone"),
  email: z.string().email("Invalid email"),
  governorate: z.string().min(1, "Select governorate"),
  address: z.string().min(10, "Enter full address"),
});
type DeliveryData = z.infer<typeof deliverySchema>;

function SuccessScreen({ orderId }: { orderId: number }) {
  const [, setLocation] = useLocation();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 max-w-md mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Check size={36} className="text-green-600" />
      </motion.div>
      <h2 className="font-serif text-3xl font-bold mb-2">Order Placed!</h2>
      <p className="text-muted-foreground mb-1">Order #{orderId}</p>
      <p className="text-muted-foreground text-sm mb-8">We'll send a confirmation to your email. Your order will arrive in 2–5 business days.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => setLocation(`/account`)} className="bg-foreground text-background hover:opacity-90" data-testid="button-view-orders">View My Orders</Button>
        <Button variant="outline" onClick={() => setLocation("/products")} data-testid="button-continue-shopping">Continue Shopping</Button>
      </div>
    </motion.div>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [codDownPaymentAmount, setCodDownPaymentAmount] = useState(50);
  const [codDownPaymentMethod, setCodDownPaymentMethod] = useState("instapay");

  const { items, total, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const createOrder = useCreateOrder();
  const validatePromo = useValidatePromo();

  // Fetch COD down payment setting on mount
  useState(() => {
    fetch("/api/settings/cod-down-payment").then(r => r.json()).then(d => {
      if (d.amount) setCodDownPaymentAmount(d.amount);
    }).catch(() => {});
  });

  const shipping = total > 0 && total < 500 ? 50 : 0;
  const codFee = paymentMethod === "cod" ? 20 : 0;
  const finalTotal = total + shipping + codFee - discount;
  const amountDueOnDelivery = paymentMethod === "cod" ? Math.max(0, finalTotal - codDownPaymentAmount) : 0;

  const { register, handleSubmit, formState: { errors } } = useForm<DeliveryData>({ resolver: zodResolver(deliverySchema) });

  const handlePromo = () => {
    validatePromo.mutate({ data: { code: promoCode, cartTotal: total } }, {
      onSuccess: (res) => { setDiscount(res.discountAmount ?? 0); toast.success(`Promo applied: -${(res.discountAmount ?? 0).toLocaleString()} EGP`); },
      onError: () => toast.error("Invalid promo code"),
    });
  };

  const handlePlaceOrder = () => {
    if (!isLoggedIn) { toast.error("Please sign in to place an order"); return; }
    if (!deliveryData) return;
    createOrder.mutate({
      data: {
        items: items.map(i => ({ productId: i.productId, productName: i.product.name, quantity: i.quantity, size: i.size, color: i.color, price: i.product.salePrice ?? i.product.price, image: i.product.images[0] })),
        fullName: deliveryData.fullName, phone: deliveryData.phone, email: deliveryData.email,
        governorate: deliveryData.governorate, address: deliveryData.address,
        paymentMethod, promoCode: promoCode || undefined,
        subtotal: total, shipping: shipping + codFee, discount, total: finalTotal,
        ...(paymentMethod === "cod" ? {
          codDownPayment: codDownPaymentAmount,
          codDownPaymentMethod,
          codDownPaymentStatus: "pending",
        } : {}),
      } as any
    }, {
      onSuccess: (order) => { clearCart(); setPlacedOrderId(order.id); },
      onError: () => toast.error("Failed to place order. Try again."),
    });
  };

  if (placedOrderId) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SuccessScreen orderId={placedOrderId} />
    </div>
  );

  const STEPS = [
    { n: 1, label: "Delivery", icon: Package },
    { n: 2, label: "Payment", icon: CreditCard },
    { n: 3, label: "Confirm", icon: FileText },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-bold mb-8">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step > s.n ? "bg-green-500 text-white" : step === s.n ? "bg-foreground text-background" : "bg-muted"}`}>
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className="font-medium text-sm hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${step > s.n ? "bg-green-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-semibold text-lg mb-4">Delivery Information</h2>
                <form onSubmit={handleSubmit(data => { setDeliveryData(data); setStep(2); })} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input placeholder="Layla Ahmed" {...register("fullName")} data-testid="input-fullname" />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input placeholder="+20 1XX XXX XXXX" {...register("phone")} data-testid="input-phone" />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="your@email.com" {...register("email")} data-testid="input-email" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Governorate</Label>
                    <select {...register("governorate")} className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-governorate">
                      <option value="">Select governorate</option>
                      {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {errors.governorate && <p className="text-xs text-destructive">{errors.governorate.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Full Address</Label>
                    <Input placeholder="Street, building, apartment..." {...register("address")} data-testid="input-address" />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-foreground text-background hover:opacity-90 h-12 font-semibold" data-testid="button-next-step1">
                    Continue to Payment <ChevronRight size={16} className="ml-1" />
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(pm => (
                    <label key={pm.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === pm.id ? "border-foreground" : "border-border hover:border-foreground/40"}`} data-testid={`radio-payment-${pm.id}`}>
                      <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === pm.id ? "border-foreground" : "border-border"}`}>
                        {paymentMethod === pm.id && <div className="w-2 h-2 rounded-full bg-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {paymentMethod === "card" && (
                  <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                    <p className="text-xs text-muted-foreground">Test mode — no real charge</p>
                    <Input placeholder="Card number: 4242 4242 4242 4242" data-testid="input-card-number" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="MM/YY" data-testid="input-card-expiry" />
                      <Input placeholder="CVV" data-testid="input-card-cvv" />
                    </div>
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Down Payment Required</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">A non-refundable down payment of <strong>{codDownPaymentAmount} EGP</strong> is required to confirm your order. The remaining <strong>{amountDueOnDelivery.toLocaleString()} EGP</strong> will be collected upon delivery.</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Pay down payment via</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["instapay", "vodafone", "fawry", "bank"].map(m => (
                          <label key={m} className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer text-sm transition-colors capitalize ${codDownPaymentMethod === m ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-border hover:border-amber-300"}`} data-testid={`cod-method-${m}`}>
                            <input type="radio" name="cod-method" value={m} checked={codDownPaymentMethod === m} onChange={() => setCodDownPaymentMethod(m)} className="sr-only" />
                            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${codDownPaymentMethod === m ? "border-amber-500 bg-amber-500" : "border-border"}`} />
                            {m === "bank" ? "Bank Transfer" : m.charAt(0).toUpperCase() + m.slice(1)}
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Payment instructions will be sent to your email after order confirmation.</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-back-step2">Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-foreground text-background hover:opacity-90 font-semibold" data-testid="button-next-step2">
                    Review Order <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-semibold text-lg mb-4">Review & Confirm</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border">
                    <p className="font-semibold text-sm mb-2">Delivery to</p>
                    <p className="text-sm">{deliveryData?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{deliveryData?.address}, {deliveryData?.governorate}</p>
                    <p className="text-sm text-muted-foreground">{deliveryData?.phone}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <p className="font-semibold text-sm mb-2">Payment</p>
                    <p className="text-sm">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <p className="font-semibold text-sm mb-3">Items ({items.length})</p>
                    {items.map(i => (
                      <div key={i.productId} className="flex justify-between text-sm py-1">
                        <span>{i.product.name} × {i.quantity}</span>
                        <span>{((i.product.salePrice ?? i.product.price) * i.quantity).toLocaleString()} EGP</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="button-back-step3">Back</Button>
                  <Button onClick={handlePlaceOrder} className="flex-1 bg-[#D4608A] text-white hover:opacity-90 font-semibold h-12"
                    disabled={createOrder.isPending} data-testid="button-place-order">
                    {createOrder.isPending ? "Placing..." : `Place Order — ${finalTotal.toLocaleString()} EGP`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-2xl p-5 sticky top-20 space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {items.map(i => (
                <div key={i.productId} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {i.product.images[0] && <img src={i.product.images[0]} alt={i.product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight truncate">{i.product.name}</p>
                    <p className="text-xs text-muted-foreground">× {i.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold whitespace-nowrap">{((i.product.salePrice ?? i.product.price) * i.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="flex-1 text-sm" data-testid="input-promo" />
              <Button variant="outline" size="sm" onClick={handlePromo} disabled={validatePromo.isPending} data-testid="button-apply-promo">Apply</Button>
            </div>
            <div className="space-y-1.5 text-sm border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{total.toLocaleString()} EGP</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{shipping === 0 ? "Free" : `${shipping} EGP`}</span></div>
              {codFee > 0 && <div className="flex justify-between text-muted-foreground"><span>COD Fee</span><span>{codFee} EGP</span></div>}
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{discount.toLocaleString()} EGP</span></div>}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border" data-testid="text-order-total">
                <span>Total</span><span>{finalTotal.toLocaleString()} EGP</span>
              </div>
              {paymentMethod === "cod" && (
                <div className="mt-2 pt-2 border-t border-amber-200 space-y-1">
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 text-xs font-medium">
                    <span>Down payment now</span><span>{codDownPaymentAmount} EGP</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Due on delivery</span><span>{amountDueOnDelivery.toLocaleString()} EGP</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
