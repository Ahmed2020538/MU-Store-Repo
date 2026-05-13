import { FileText } from "lucide-react";

const sections = [
  {
    title: "Acceptance of Terms",
    body: `By accessing or using the MU platform — including browsing, creating an account, or placing an order — you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. These terms apply to all visitors, users, and customers of MU.`,
  },
  {
    title: "Products & Pricing",
    body: `All prices on MU are displayed in Egyptian Pounds (EGP) and are subject to change without notice. We make every effort to ensure product descriptions, images, and prices are accurate. In the event of a pricing error, we reserve the right to cancel or amend the order and notify you promptly. Product availability is subject to stock levels and may change at any time.`,
  },
  {
    title: "Orders & Payment",
    body: `By placing an order, you make an offer to purchase products at the listed price. We reserve the right to accept or decline any order. Payment must be completed before an order is processed. Accepted payment methods include credit/debit cards, Fawry, Cash on Delivery (COD), and Vodafone Cash. For COD orders, a down payment is required at time of order placement.`,
  },
  {
    title: "Shipping & Delivery",
    body: `MU ships throughout Egypt. Estimated delivery times vary by governorate: 1–2 business days for Cairo, Giza, and Alexandria; 3–5 business days for most other governorates; 5–7 business days for remote areas. Delivery times are estimates and may vary. Free shipping is available on orders over 500 EGP. Risk of loss and title for products passes to you upon delivery.`,
  },
  {
    title: "Returns & Exchanges",
    body: `We accept returns and exchanges within 14 days of delivery for unused items in their original packaging. Sale items and accessories may not be eligible for return. To initiate a return, contact our customer service team. Refunds are issued to the original payment method within 5–10 business days of receiving the returned item.`,
  },
  {
    title: "User Accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these terms, engage in fraudulent activity, or otherwise harm the MU platform or community.`,
  },
  {
    title: "Intellectual Property",
    body: `All content on the MU platform — including product images, text, design, logos, and branding — is owned by MU or its licensors and is protected by Egyptian and international intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without express written permission.`,
  },
  {
    title: "Limitation of Liability",
    body: `To the fullest extent permitted by law, MU shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our platform or products. Our total liability for any claim arising from these terms shall not exceed the amount paid by you for the specific order in question.`,
  },
  {
    title: "Governing Law",
    body: `These Terms of Service are governed by the laws of the Arab Republic of Egypt. Any disputes arising from these terms or your use of MU shall be subject to the exclusive jurisdiction of the courts of Cairo, Egypt.`,
  },
  {
    title: "Contact",
    body: `For questions about these Terms of Service, contact our legal team at legal@mu.com.eg or write to: MU Legal Department, Cairo, Egypt.`,
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
          <FileText size={20} className="text-[#C9A96E]" />
        </div>
        <p className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] font-semibold">Legal</p>
      </div>
      <h1 className="font-serif text-4xl font-bold mb-3">Terms of Service</h1>
      <p className="text-muted-foreground mb-10">
        Last updated: May 2026 · Please read these terms carefully before using MU.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-10">
        These Terms of Service ("Terms") govern your use of the MU e-commerce platform and any purchases made through it. MU is a luxury women's footwear and accessories brand based in Egypt, operating at mu.com.eg.
      </p>
      <div className="space-y-8">
        {sections.map((s, i) => (
          <div key={i} className="border-l-2 border-[#C9A96E]/30 pl-6">
            <h2 className="font-semibold text-lg mb-2">{i + 1}. {s.title}</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
