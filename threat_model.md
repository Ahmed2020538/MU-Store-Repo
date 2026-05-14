# Threat Model

## Project Overview

MU Store is a React + Vite storefront backed by an Express 5 API and PostgreSQL/Drizzle for a luxury e-commerce workflow. Public users can browse products and place guest or authenticated orders; authenticated users can access account features; admins can manage products, orders, customers, coupons, messages, site settings, and other store content. Production auth is stateless JWT in the `Authorization` header, while short-lived Express sessions are used for social-login handshakes only. The mockup sandbox artifact is development-only and out of scope unless production reachability is later demonstrated.

## Assets

- **User accounts and sessions** — customer/admin identities, password hashes, JWTs, and social-auth identities. Compromise enables account takeover and admin impersonation.
- **Order and customer PII** — names, phone numbers, email addresses, governorates, street addresses, and order contents. Exposure harms customers and store operations.
- **Administrative control plane** — product CRUD, order management, coupon management, SMTP settings, contact messages, and customer priority/admin management. Compromise enables full business takeover.
- **Pricing and promotion integrity** — product prices, discounts, shipping fees, COD down-payment logic, loyalty points, and stock counts. Tampering directly affects revenue and inventory.
- **Application secrets** — `JWT_SECRET`, `SESSION_SECRET`, SMTP credentials, OAuth credentials, and database access. Leakage or weak defaults can invalidate trust boundaries.
- **Uploaded and generated media** — product images and temporary try-on photos/results. Improper access or validation can leak user content or enable stored-content abuse.

## Trust Boundaries

- **Browser to API** — all frontend state, localStorage values, query parameters, and request bodies are untrusted and must be validated server-side.
- **Public to authenticated** — browsing and contact flows are public; account, wishlist, saved looks, and coupon/order history require a valid JWT.
- **Authenticated to admin** — admin pages are visible client-side, but the API must enforce admin-only access independently of the frontend.
- **API to PostgreSQL** — the API has broad database access and therefore must prevent authorization failures and business-logic tampering before persistence.
- **API to third parties** — SMTP and social OAuth providers, plus the Hugging Face try-on service, sit outside the trust boundary and require careful URL/secret handling and timeouts.
- **Production to dev-only artifacts** — `artifacts/mockup-sandbox/` is not production-deployed under current assumptions and should usually be ignored during production scans.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/`, `artifacts/mu-store/src/App.tsx`, `artifacts/mu-store/src/main.tsx`.
- **Highest-risk server areas:** `artifacts/api-server/src/lib/auth.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/orders.ts`, `artifacts/api-server/src/routes/admin*.ts`, `artifacts/api-server/src/routes/settings.ts`, `artifacts/api-server/src/routes/uploads.ts`, `artifacts/api-server/src/routes/tryon.ts`.
- **Public surfaces:** products, categories, checkout, contact, promo validation, try-on upload/start/status, public settings/social/contact reads.
- **Authenticated surfaces:** `/api/auth/me`, `/api/orders`, wishlist, reviews, profile, coupons, saved looks.
- **Admin surfaces:** `/api/admin/**`, `/api/admin/admins/**`, `/api/admin/coupons/**`, admin writes under `/api/settings/**`, uploads, testimonials, brands, outfits, contact-admin views.
- **Usually ignore as dev-only:** `artifacts/mockup-sandbox/**`, generated client/spec output unless needed to understand production request shapes.

## Threat Categories

### Spoofing

The application relies on bearer JWTs for both customer and admin authorization, so token issuance and verification are a primary control point. Production must reject weak or default signing secrets, validate every protected request server-side, and ensure OAuth callbacks cannot redirect tokens to attacker-controlled origins.

### Tampering

The checkout flow accepts cart contents, totals, discounts, shipping, and payment-related fields from the browser, which is an untrusted environment. The API must recompute authoritative pricing, promo effects, fees, loyalty accrual, and stock updates from server-side product/coupon data before an order is accepted.

### Information Disclosure

Orders, contact messages, customer records, SMTP configuration, and try-on images contain sensitive business and personal data. Public endpoints must never expose another customer’s order or media, admin-only endpoints must stay admin-only even if the frontend route guard is bypassed, and logs/emails/errors must avoid leaking secrets or private data.

### Denial of Service

Public auth, checkout, contact, upload, and try-on endpoints can be abused for resource exhaustion. Production should maintain meaningful request limits, body/file size limits, and outbound request timeouts for external services, especially for unauthenticated endpoints that process images or create orders.

### Elevation of Privilege

Admin features cover the full store control plane, so any weakness in JWT trust, role checks, or bootstrap/admin account handling can become full compromise. The system must enforce admin authorization on every sensitive route, avoid built-in credentials or predictable bootstrap secrets, and prevent attackers from turning public or customer-level access into admin access.
