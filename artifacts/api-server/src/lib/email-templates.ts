interface OrderItem {
  productName: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
  image?: string;
}

interface OrderEmailData {
  orderId: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  governorate?: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItem[];
  promoCode?: string;
  codDownPayment?: number;
  codDownPaymentMethod?: string;
  amountDueOnDelivery?: number;
}

const NAVY = "#1A1A2E";
const GOLD = "#C9A96E";
const BG = "#F8F5F0";
const BORDER = "#E5DDD0";

function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    card: "Credit / Debit Card",
    fawry: "Fawry",
    cod: "Cash on Delivery",
    vodafone: "Vodafone Cash",
    instapay: "InstaPay",
    bank: "Bank Transfer",
  };
  return map[method] ?? method;
}

export function orderConfirmationHtml(data: OrderEmailData): string {
  const isCod = data.paymentMethod === "cod";

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="56" valign="top" style="padding-right:12px;">
              ${item.image
                ? `<img src="${item.image}" width="56" height="56" style="border-radius:8px;object-fit:cover;display:block;" alt="${item.productName}" />`
                : `<div style="width:56px;height:56px;border-radius:8px;background:${BORDER};"></div>`}
            </td>
            <td valign="middle">
              <p style="margin:0;font-size:14px;font-weight:600;color:${NAVY};">${item.productName}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#888;">
                ${[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(" · ")}
                · Qty: ${item.quantity}
              </p>
            </td>
            <td valign="middle" align="right" style="white-space:nowrap;">
              <p style="margin:0;font-size:14px;font-weight:600;color:${NAVY};">${(item.price * item.quantity).toLocaleString()} EGP</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const codInstructionsHtml = isCod ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#FFF8E1;border:1px solid #FFE082;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#E65100;">⚠️ Action Required — Down Payment</p>
          <p style="margin:0 0 12px;font-size:14px;color:#5D4037;line-height:1.6;">
            To confirm your order, a non-refundable down payment of
            <strong style="color:#E65100;">${(data.codDownPayment ?? 0).toLocaleString()} EGP</strong>
            must be paid via <strong>${paymentLabel(data.codDownPaymentMethod ?? "instapay")}</strong>.
            The remaining <strong>${(data.amountDueOnDelivery ?? 0).toLocaleString()} EGP</strong> will be collected upon delivery.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#E65100;border-radius:8px;padding:10px 20px;">
                <a href="mailto:support@mu-store.com" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Contact us for payment details</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order Confirmation — MU Store</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${NAVY};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:6px;color:${GOLD};font-family:Georgia,serif;">MU</p>
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:3px;color:rgba(201,169,110,0.7);text-transform:uppercase;">Where Every Step Tells Your Story</p>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="background:#fff;padding:32px 40px 24px;text-align:center;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
            <div style="width:56px;height:56px;background:#ECFDF5;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">✓</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${NAVY};font-family:Georgia,serif;">Order Confirmed!</h1>
            <p style="margin:0;font-size:15px;color:#666;">Thank you, ${data.fullName}. Your order has been received.</p>
            <p style="margin:12px 0 0;font-size:22px;font-weight:700;color:${GOLD};">Order #${data.orderId}</p>
          </td>
        </tr>

        <!-- COD Instructions (if applicable) -->
        ${isCod ? `<tr><td style="background:#fff;padding:0 40px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">${codInstructionsHtml}</td></tr>` : ""}

        <!-- Items -->
        <tr>
          <td style="background:#fff;padding:0 40px 24px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:${NAVY};text-transform:uppercase;letter-spacing:1px;">Your Items</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="background:#fff;padding:0 40px 24px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:12px;padding:16px 20px;">
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#666;">Subtotal</td>
                <td style="padding:4px 0;font-size:13px;color:#666;text-align:right;">${data.subtotal.toLocaleString()} EGP</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#666;">Shipping</td>
                <td style="padding:4px 0;font-size:13px;color:#666;text-align:right;">${data.shipping === 0 ? "Free" : `${data.shipping.toLocaleString()} EGP`}</td>
              </tr>
              ${data.discount > 0 ? `
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#16a34a;">Discount${data.promoCode ? ` (${data.promoCode})` : ""}</td>
                <td style="padding:4px 0;font-size:13px;color:#16a34a;text-align:right;">-${data.discount.toLocaleString()} EGP</td>
              </tr>` : ""}
              <tr>
                <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:${NAVY};border-top:1px solid ${BORDER};">Total</td>
                <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:${NAVY};text-align:right;border-top:1px solid ${BORDER};">${data.total.toLocaleString()} EGP</td>
              </tr>
              ${isCod ? `
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#E65100;">Down payment (now)</td>
                <td style="padding:4px 0;font-size:12px;color:#E65100;text-align:right;">${(data.codDownPayment ?? 0).toLocaleString()} EGP</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#888;">Due on delivery</td>
                <td style="padding:4px 0;font-size:12px;color:#888;text-align:right;">${(data.amountDueOnDelivery ?? 0).toLocaleString()} EGP</td>
              </tr>` : ""}
            </table>
          </td>
        </tr>

        <!-- Delivery & Payment -->
        <tr>
          <td style="background:#fff;padding:0 40px 32px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" valign="top" style="padding-right:12px;">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${NAVY};text-transform:uppercase;letter-spacing:1px;">Delivery To</p>
                  <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                    ${data.fullName}<br/>
                    ${data.address ?? ""}${data.governorate ? `, ${data.governorate}` : ""}<br/>
                    ${data.phone ?? ""}
                  </p>
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${NAVY};text-transform:uppercase;letter-spacing:1px;">Payment</p>
                  <p style="margin:0;font-size:13px;color:#555;">${paymentLabel(data.paymentMethod)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#fff;padding:0 40px 32px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:${NAVY};border-radius:10px;padding:14px 32px;">
                  <a href="${process.env["STORE_URL"] ?? "https://mu-store.com"}/account" style="color:${GOLD};text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;">Track Your Order →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${NAVY};border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(201,169,110,0.8);">Questions? Email us at <a href="mailto:support@mu-store.com" style="color:${GOLD};">support@mu-store.com</a></p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">© ${new Date().getFullYear()} MU Store · Cairo, Egypt</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
