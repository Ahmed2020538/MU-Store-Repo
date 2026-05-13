import { Shield } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    body: `When you shop with MU, we collect information you provide directly — your name, email address, phone number, shipping address, and payment details processed securely through our payment partners. We also collect information automatically, such as your browsing behavior on our site, products you view, and items added to your cart or wishlist. This helps us personalize your experience and improve our platform.`,
  },
  {
    title: "How We Use Your Information",
    body: `We use your information to: process and fulfill your orders; send order confirmations, shipping updates, and receipts; provide customer support; personalize product recommendations and your shopping experience; send marketing communications (only with your consent); detect and prevent fraud; and comply with legal obligations under Egyptian law and applicable regulations.`,
  },
  {
    title: "Sharing Your Information",
    body: `MU does not sell your personal data. We share information only with trusted partners who help us operate our business: shipping and logistics providers to deliver your orders; secure payment processors (all card data is encrypted and never stored on our servers); analytics services to help us understand how our platform is used. All partners are contractually obligated to protect your data.`,
  },
  {
    title: "Data Storage & Security",
    body: `Your data is stored on secure, encrypted servers. We implement industry-standard security practices including HTTPS encryption, access controls, and regular security audits. While no system is completely immune to risk, we take every reasonable precaution to protect your information.`,
  },
  {
    title: "Your Rights",
    body: `You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data (subject to legal obligations); withdraw consent for marketing communications at any time; export your data in a portable format. To exercise any of these rights, contact us at privacy@mu.com.eg.`,
  },
  {
    title: "Cookies",
    body: `We use cookies to operate our website and improve your experience. Essential cookies are required for the site to function. Analytics cookies help us understand traffic patterns. Marketing cookies allow us to show you relevant content. You can manage your cookie preferences at any time using the cookie settings panel available on our website.`,
  },
  {
    title: "Children's Privacy",
    body: `MU is intended for users aged 18 and over. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately and we will delete it.`,
  },
  {
    title: "Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by email or by displaying a notice on our website. The date at the bottom of this page indicates when the policy was last updated.`,
  },
  {
    title: "Contact Us",
    body: `For any questions about this Privacy Policy or how we handle your data, please contact our Privacy Team at privacy@mu.com.eg or write to: MU, Privacy Office, Cairo, Egypt.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
          <Shield size={20} className="text-[#C9A96E]" />
        </div>
        <p className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] font-semibold">Legal</p>
      </div>
      <h1 className="font-serif text-4xl font-bold mb-3">Privacy Policy</h1>
      <p className="text-muted-foreground mb-10">
        Last updated: May 2026 · Effective immediately upon publication.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-10">
        At MU, your privacy is fundamental to how we operate. This Privacy Policy explains what personal information we collect, how we use it, and your rights regarding your data. By using the MU platform, you agree to the practices described in this policy.
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
