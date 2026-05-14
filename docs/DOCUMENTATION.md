# MU Store — Complete Technical & Product Documentation

> Generated: May 2026 | Stack: React + Vite · Express 5 · PostgreSQL · Drizzle ORM · TypeScript 5.9

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Feature Breakdown](#2-feature-breakdown)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [Auth & Security](#6-auth--security)
7. [UI/UX Design System](#7-uiux-design-system)
8. [All Pages & Routes](#8-all-pages--routes)
9. [Full API Reference](#9-full-api-reference)
10. [Deployment & DevOps](#10-deployment--devops)
11. [How To Rebuild](#11-how-to-rebuild)
12. [Codebase Intelligence](#12-codebase-intelligence)
13. [Complete Project Blueprint](#13-complete-project-blueprint)
14. [Feature Dependency Map & System Architecture Summary](#14-feature-dependency-map--system-architecture-summary)

---

## 1. Project Overview

### Purpose

MU Store is a premium Egyptian women's shoes and bags e-commerce platform. It positions itself as a luxury artisan brand selling handcrafted footwear and accessories in the 700–2500 EGP price range.

### Target Users

| Segment | Description |
|---|---|
| **Shoppers** | Egyptian women seeking luxury handcrafted shoes and bags |
| **Guest visitors** | Browse products, add to cart, and complete checkout without an account |
| **Registered customers** | Full loyalty programme, wishlist, saved looks, order history, VIP profile |
| **Admins** | Store operators managing products, orders, customers, coupons, content, and settings |

### Business Model

- Direct-to-consumer product sales (shoes and bags)
- Promo code system for campaigns and loyalty incentives
- Loyalty points earned per purchase (1 point per 10 EGP spent)
- VIP priority membership granted on profile completion
- Birthday coupon generated automatically each year
- COD (Cash on Delivery) with configurable down-payment

### User Journey

```
Home → Browse/Search Products → Product Detail (gallery, size/color selection, try-on)
→ Add to Cart → Cart Drawer (promo code) → Checkout (3 steps: delivery, payment, confirm)
→ Order confirmed + email confirmation → Order history in account
```

Alternatively:
```
Register → Complete Profile (VIP upgrade + 100 bonus points) → Personalized shopping
```

---

## 2. Feature Breakdown

### 2.1 Product Catalog

**What:** Paginated, filterable product grid listing shoes and bags.

**Filters:** Category (slug-based), price range (min/max), size (JSONB array containment), colour (JSONB array containment), search (case-insensitive ILIKE), sort (newest / price_asc / price_desc / best_selling / top_rated).

**Backend:** `GET /api/products` — no auth required. Computes average rating and review count per product on the fly from the `reviews` table.

**DB tables:** `products`, `categories`, `reviews`

**Validation:** Query params cast to float/int; invalid category slug returns empty result set.

**Edge cases:** Hidden products (`isHidden = true`) are excluded from public listings. Admin-only routes include hidden products.

### 2.2 Product Detail

**What:** Single product page with image gallery, size selector, colour selector, add-to-cart, reviews list, complete-the-look outfits, and virtual try-on button.

**Backend:** `GET /api/products/:id`, `GET /api/products/:id/reviews`

**DB tables:** `products`, `reviews`, `outfits`, `outfit_items`

**Auth rules:** None for viewing. Writing reviews requires auth.

### 2.3 Shopping Cart

**What:** In-memory session cart stored server-side in a `Map<string, item[]>`. Supports add, update quantity, remove, and clear.

**Backend:** `GET/POST /api/cart`, `PUT/DELETE /api/cart/:productId`

**Cart key logic (`getCartKey`):**
- If `Authorization: Bearer <token>` header is present → key is `user:<token>` (stable across requests for logged-in users).
- Otherwise → reads `cart_sid` cookie. If the cookie is present the key is `sid:<cookie-value>`.
- **Important:** If neither header nor cookie is present, a random ephemeral string is generated per request. The server never writes the `cart_sid` cookie, so anonymous carts are functionally ephemeral — items are lost between requests unless the client sends the same auth token or an externally-set `cart_sid` cookie.

**Business logic:**
- Free shipping on orders ≥ 500 EGP (subtotal ≥ 500 → shipping = 0; otherwise shipping = 50 EGP).
- Cart merges duplicate items (same productId + size + colour) by incrementing quantity (capped at 20).
- In the frontend, `CartContext` manages cart state in React memory independently of the server cart.

**Limitation:** In-memory only — all carts are lost on server restart. No DB persistence.

### 2.4 Checkout (3-Step)

**What:** Three-step wizard: (1) Delivery info (name, phone, email, Egyptian governorate, address), (2) Payment method (credit card / COD), (3) Confirmation.

**Backend:** `POST /api/orders`

**Auth rules:** Optional auth (`optionalAuth`). Guest and authenticated checkouts both work.

**COD flow:** A configurable down-payment (default 50 EGP) is captured upfront; remaining balance due on delivery. Down-payment method configurable per order.

**Post-order actions:**
- Stock decremented (best-effort, non-blocking, using `GREATEST(0, stock - qty)`)
- Loyalty points added for authenticated users (1 point per 10 EGP)
- Order confirmation email sent to customer
- Cart is cleared on the frontend

**Promo codes:** Applied client-side and validated server-side via `POST /api/promo/validate` before order creation.

### 2.5 Promo Codes & Coupons

**What:** Two-tier discount system.

| Tier | Table | Source | Type |
|---|---|---|---|
| Global discount codes | `discount_codes` | Admin-created | percentage / fixed / free_shipping |
| User-specific coupons | `coupons` | Birthday job / admin | percentage only |

**Pre-seeded codes:**
- `MU20` → 20% off (discount_codes)
- `FREESHIP` → free shipping (discount_codes)
- `WELCOME10` → 10% off (discount_codes)

**Validation endpoint:** `POST /api/promo/validate` — checks discount_codes first, then user coupons. Returns `discountType`, `discountValue`, and computed `discountAmount`.

**Mark used:** `POST /api/promo/use` (auth required) — marks a user coupon as used after order placed.

### 2.6 Order History & Tracking

**What:** Authenticated users can view their order history. Admins can view and manage all orders.

**Backend:** `GET /api/orders` (user history), `GET /api/orders/:id` (single order — owner, admin, or guest order), `GET /orders/admin/all` (admin), `PUT /orders/admin/:id/status` (admin).

**Order statuses:** `pending → confirmed → packed → shipped → delivered → cancelled`

**Access control:** Owner or admin can view a specific order; guest orders (no userId) are visible to anyone with the order ID.

### 2.7 User Authentication

**What:** Email/password registration and login, plus OAuth social login.

**Email flow:** Register (`POST /api/auth/register`) → JWT issued → stored in `localStorage` as `mu_token`. Login (`POST /api/auth/login`) → same.

**Social OAuth providers:** Google, Facebook/Instagram, Twitter/X, Apple. Each uses Passport.js strategy configured if env vars present.

**OAuth flow:** Click provider button → redirect to `/api/auth/<provider>` → Passport authenticate → upsert user in DB → redirect to `/auth-callback?token=...&user=...` → frontend stores token.

**Token expiry:** 7 days (`expiresIn: "7d"`).

**DB:** `users` table — `authProvider`, `authProviderId` for social accounts; `passwordHash` empty string for social-only users.

### 2.8 User Profile & VIP Programme

**What:** Multi-step profile completion wizard (name/phone/birthdate → address → social handles). On first completion: user gets `isPriority = 1`, `isProfileComplete = 1`, and 100 bonus loyalty points.

**Backend:** `POST /api/profile/complete`, `PUT /api/profile/socials`

**VIP email:** Sent automatically on first profile completion with VIP benefits summary.

### 2.9 Loyalty Points

**What:** Points accrued on every purchase. 1 point per 10 EGP of order total. Shown in account page and navbar.

**DB:** `users.loyaltyPoints` (integer)

**Accrual:** Non-blocking `setImmediate` after order creation.

**Birthday coupon:** A cron-like job (`startBirthdayJob`) runs on server startup and daily thereafter; checks for users whose birthday is today and whose birthday coupon hasn't been issued this year, then generates a coupon in the `coupons` table and emails the user.

### 2.10 Wishlist

**What:** Authenticated users can save/remove products to a persistent wishlist.

**Backend:** `GET /api/wishlist`, `POST /api/wishlist/:productId`, `DELETE /api/wishlist/:productId`

**DB:** `wishlist` table (userId + productId)

### 2.11 Product Reviews

**What:** Authenticated users post star ratings (1–5) and optional text comment on products. Average rating shown on product card and detail.

**Backend:** `POST /api/reviews`, `GET /api/products/:id/reviews`

**DB:** `reviews` table

### 2.12 Outfits / Complete the Look

**What:** Admin-curated outfit collections linking multiple products. Users can save outfits to their "saved looks". Published outfits appear on product detail pages.

**Backend:** `GET /api/outfits`, `GET /api/outfits/:id`, `GET /api/outfits/saved` (auth), `POST /api/outfits/:id/save` (auth), `DELETE /api/outfits/:id/save` (auth). Admin CRUD: `POST`, `PUT`, `DELETE /api/outfits`.

**DB:** `outfits`, `outfit_items`, `saved_looks`

### 2.13 Virtual Try-On

**What:** AI-powered clothing try-on using the Hugging Face IDM-VTON space. Users upload a photo of themselves and see the product virtually worn.

**Backend flow:**
1. `POST /api/tryon/upload` — accepts user image, optionally resizes via `sharp`, stores to temp dir with 15-min TTL, returns a temp URL.
2. `POST /api/tryon/start` — submits job to HF Space Gradio queue, returns `predictionId`.
3. `GET /api/tryon/status/:predictionId` — polls HF SSE stream for progress/completion, returns status + result image URL.

**HF Space:** `https://yisol-idm-vton.hf.space`

**Auth:** Not required — public endpoint.

**Limitations:** Depends on external HF Space availability. No auth on endpoints.

### 2.14 Admin Dashboard

**What:** Full back-office interface accessible at `/admin` for users with `role = "admin"`.

**Tabs and features:**

| Tab | Feature |
|---|---|
| Dashboard | KPI cards (revenue, orders, products, customers), revenue by category chart, orders by status chart, recent orders list, AI insights (revenue by day, top products, low stock) |
| Orders | Full order list with status management and order detail view |
| Products | Product CRUD with image upload, bulk visibility toggle |
| Customers | Customer list, priority flag toggle |
| Coupons | User coupon management (birthday coupons, toggle used, extend expiry, bulk delete expired) |
| Discount Codes | Global promo code management |
| Messages | Contact form inbox with read/unread status |
| Outfits | Complete-the-look outfit CRUD |
| Brands | Logo carousel management |
| Testimonials | Customer testimonial management |
| Hero | Hero section content editor |
| Social | Social media links configuration |
| Contact Settings | Store contact info, WhatsApp button, working hours |
| SMTP | Email configuration and test send |
| Admins | Admin user creation, deactivation, deletion |

**Auth:** All admin API routes protected by `requireAdmin` middleware (JWT + `role === "admin"` check).

### 2.15 Contact Form

**What:** Public contact form that stores messages and sends email notifications (to admin and auto-reply to customer).

**Backend:** `POST /api/contact`, admin management via `GET/PUT/DELETE /api/contact/admin`.

**Tracking ref:** Auto-generated `MU-<timestamp-base36>` reference included in emails.

### 2.16 Internationalisation (i18n)

**What:** 12-language support with RTL for Arabic, Farsi, and Urdu.

**Languages:** English (default), Arabic, French, German, Spanish, Italian, Turkish, Farsi, Urdu, Chinese, Japanese, Russian.

**Implementation:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`. Language stored in `localStorage` key `mu_language`. RTL languages automatically apply `dir="rtl"` to `<html>`.

### 2.17 Brands Carousel

**What:** Curated list of affiliated or featured brands shown in a scrolling carousel on the homepage.

**DB:** `brands` table (name, logoUrl, websiteUrl, displayOrder, active)

**Backend:** `GET /api/brands` (public), admin CRUD via brand routes.

### 2.18 Testimonials

**What:** Curated customer testimonials shown on the homepage. Supports bilingual text, avatar, rating, verified purchase badge, and display order.

**DB:** `testimonials` table

**Backend:** `GET /api/testimonials` (public), admin CRUD.

---

## 3. Frontend Architecture

### Stack

| Technology | Version | Role |
|---|---|---|
| React | 19.1.0 | UI framework |
| Vite | 7.x | Build tool and dev server |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS v4 | @tailwindcss/vite | Utility-first styling |
| Framer Motion | 12.x | Animations and transitions |
| Wouter | 3.x | Client-side routing |
| TanStack Query | 5.x | Server state, data fetching |
| i18next | - | Internationalisation |
| React Hook Form | - | Form state management |
| Zod | v4 | Client-side form validation |
| Sonner | - | Toast notifications |
| Lucide React | - | Icon set |
| React Icons (fa6) | - | Social provider icons |

### Folder Structure

```
artifacts/mu-store/src/
├── App.tsx                  # Root app — providers + router
├── i18n.ts                  # i18next configuration and RTL setup
├── index.css                # Tailwind base + custom CSS variables
├── main.tsx                 # React DOM entry point
├── components/
│   ├── ui/                  # shadcn/ui primitives (button, input, dialog, etc.)
│   ├── Navbar.tsx           # Top navigation with cart, auth, language switcher
│   ├── Footer.tsx           # Site footer
│   ├── CartDrawer.tsx       # Slide-out cart panel
│   ├── SearchModal.tsx      # Full-screen search overlay
│   ├── HeroSection.tsx      # Homepage hero banner
│   ├── FeaturedLooks.tsx    # Outfit collection preview
│   ├── CompleteTheLook.tsx  # Product-linked outfit recommendations
│   ├── TestimonialsSection.tsx
│   ├── BrandsCarousel.tsx
│   ├── PasswordStrength.tsx
│   ├── NotificationBell.tsx
│   ├── WhatsAppFAB.tsx      # Floating WhatsApp button
│   ├── HelpWidget.tsx       # Help/support widget
│   ├── PremiumCursor.tsx    # Custom cursor for desktop
│   ├── ScrollProgress.tsx
│   ├── ErrorBoundary.tsx
│   ├── CookieBanner.tsx
│   ├── Breadcrumb.tsx
│   ├── QuickViewModal.tsx
│   ├── LanguageSwitcher.tsx
│   ├── ThemeToggle.tsx
│   └── tryon/
│       └── TryItOnModal.tsx # Virtual try-on UI
├── pages/
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CheckoutPage.tsx
│   ├── AccountPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── AuthCallbackPage.tsx
│   ├── ProfileCompletePage.tsx
│   ├── ContactPage.tsx
│   ├── LookbookPage.tsx
│   ├── SavedLooksPage.tsx
│   ├── FashionFeedPage.tsx
│   ├── SizeGuidePage.tsx
│   ├── ShippingPolicyPage.tsx
│   ├── ReturnsPolicyPage.tsx
│   ├── PrivacyPolicyPage.tsx
│   ├── TermsPage.tsx
│   ├── AdminPage.tsx        # Admin shell with tab-based navigation
│   ├── not-found.tsx
│   └── admin/
│       ├── AdminAdminsPage.tsx
│       ├── AdminAIInsightsPage.tsx
│       ├── AdminBrandsPage.tsx
│       ├── AdminContactPage.tsx
│       ├── AdminCouponsPage.tsx
│       ├── AdminHeroPage.tsx
│       ├── AdminMessagesPage.tsx
│       ├── AdminOutfitsPage.tsx
│       ├── AdminProductModal.tsx
│       ├── AdminSocialPage.tsx
│       └── AdminTestimonialsPage.tsx
├── lib/
│   ├── auth-context.tsx     # JWT auth state (login/logout/user)
│   ├── cart-context.tsx     # In-memory cart state
│   ├── theme-context.tsx    # Dark/light theme
│   ├── search-context.tsx   # Search modal state
│   ├── notification-context.tsx
│   ├── recently-viewed.ts
│   ├── cookie-consent.ts
│   ├── save-for-later.ts
│   ├── delivery-estimate.ts
│   ├── social-config.ts
│   └── utils.ts
├── hooks/
│   ├── use-mobile.tsx
│   ├── useStyleProfile.ts   # LocalStorage style DNA quiz state
│   ├── use-toast.ts
│   └── useVoiceSearch.ts
└── locales/
    ├── en.json, ar.json, fr.json, de.json, es.json
    ├── it.json, tr.json, fa.json, ur.json, zh.json
    ├── ja.json, ru.json
```

### Routing

Wouter is the router library. `WouterRouter` is initialised with `base={import.meta.env.BASE_URL}` for path-based proxy compatibility.

**Two routing layers in `App.tsx`:**
- **Outer `Router`:** Handles full-screen pages (login, register, auth-callback, complete-profile) without the standard Navbar/Footer shell.
- **Inner `AppLayout`:** All other pages share the Navbar, Footer, CartDrawer, SearchModal, and utility components.

### State Management

| Context | State Held | Persistence |
|---|---|---|
| `AuthProvider` | `user`, `token`, `isLoggedIn`, `isAdmin` | `localStorage` (mu_token, mu_user) |
| `CartProvider` | `items[]`, `isOpen`, `total`, `itemCount` | In-memory (React state) |
| `ThemeProvider` | `theme` (light/dark) | `localStorage` |
| `SearchProvider` | Search modal open/close state | In-memory |
| `NotificationProvider` | Notification state | In-memory |

### Generated API Hooks

All server communication uses auto-generated TanStack Query hooks from `lib/api-client-react/src/generated/`. These are generated by Orval from the OpenAPI spec. Examples: `useListProducts()`, `useLogin()`, `useGetCart()`, `useCreateOrder()`.

### Form Validation

All forms use `react-hook-form` + `zodResolver` with Zod v4 schemas. Zod schemas for API operations are also generated from the OpenAPI spec via Orval into `lib/api-zod/src/generated/`.

### Animations

Framer Motion is used throughout for:
- Page-level fade/slide-in transitions
- Cart drawer slide animation
- Product card hover effects
- Modal entry/exit animations
- Hero section entrance animations

### Responsive Design

Tailwind CSS breakpoints (`sm`, `md`, `lg`, `xl`). Mobile-first approach. The `use-mobile.tsx` hook detects `window.innerWidth < 768` for conditional rendering.

---

## 4. Backend Architecture

### Stack

| Technology | Version | Role |
|---|---|---|
| Node.js | 24 | Runtime |
| Express 5 | 5.2.x | HTTP framework |
| TypeScript | 5.9 | Type safety |
| Drizzle ORM | 0.45.x | Database ORM |
| PostgreSQL | Managed | Database |
| bcryptjs | - | Password hashing |
| jsonwebtoken | - | JWT issuance/verification |
| Passport.js | - | OAuth strategy management |
| pino / pino-http | - | Structured JSON logging |
| express-session | - | Short-lived OAuth handshake sessions |
| express-rate-limit | - | Request rate limiting |
| multer | - | File upload handling |
| nodemailer | - | SMTP email delivery |
| esbuild | - | Production bundle (CJS) |

### Folder Structure

```
artifacts/api-server/src/
├── index.ts          # Server entry: listens on PORT, starts birthday job
├── app.ts            # Express app: middleware stack, route mounting
├── routes/
│   ├── index.ts      # Router registry — mounts all sub-routers
│   ├── health.ts     # GET /healthz
│   ├── auth.ts       # Register, login, /me, OAuth callbacks
│   ├── products.ts   # Product CRUD + filtering
│   ├── categories.ts # Category listing
│   ├── cart.ts       # In-memory session cart
│   ├── orders.ts     # Order creation + history
│   ├── wishlist.ts   # Wishlist CRUD
│   ├── reviews.ts    # Review creation
│   ├── promo.ts      # Promo code validation
│   ├── admin.ts      # Dashboard KPIs, order management, customer list
│   ├── admins.ts     # Admin user management
│   ├── admin-coupons.ts # Coupon management
│   ├── settings.ts   # Contact, social, SMTP, hero, COD settings
│   ├── uploads.ts    # Product image upload/delete
│   ├── profile.ts    # Profile completion, social handles
│   ├── contact.ts    # Contact form + admin inbox
│   ├── coupons-user.ts # User coupon endpoints
│   ├── brands.ts     # Brands CRUD
│   ├── testimonials.ts # Testimonials CRUD
│   ├── social-proof.ts # Social proof data
│   ├── tryon.ts      # Virtual try-on proxy
│   ├── outfits.ts    # Outfit CRUD + saved looks
│   └── recommendations.ts # Product recommendations
└── lib/
    ├── auth.ts       # JWT sign/verify, requireAuth, requireAdmin, optionalAuth
    ├── mailer.ts     # SMTP config, sendMail helper
    ├── passport.ts   # OAuth strategy registration (Google, Facebook, Twitter, Apple)
    ├── birthday.ts   # Birthday coupon cron job
    ├── email-templates.ts # HTML email templates
    └── logger.ts     # Pino logger singleton
```

### Middleware Stack (in order, from `app.ts`)

1. `trust proxy 1` — Correct IP/proto behind Replit reverse proxy
2. `pino-http` — Structured request/response logging (method, URL prefix, status code)
3. CORS — Allows `localhost` in dev, Replit domain origins in production; credentials: true
4. Auth rate limiter — `/api/auth/*` routes: 20 requests per 15 minutes
5. Order rate limiter — `/api/orders/*`: 10 requests per 60 seconds
6. Security headers — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
7. `express.json({ limit: "2mb" })` — JSON body parsing
8. `express.urlencoded` — Form body parsing
9. `cookieParser` — Cookie parsing (used for `cart_sid`)
10. Static files — `/uploads` directory served statically
11. Express session — Short-lived (10 min), used only for OAuth handshake state; `saveUninitialized: false`
12. `passport.initialize()` + `passport.session()` — OAuth support
13. Route handlers — mounted under `/api`

### Route Mounting Summary

```
/api/healthz              → health.ts
/api/products             → products.ts + uploads.ts + social-proof.ts + recommendations.ts
/api/categories           → categories.ts
/api/cart                 → cart.ts
/api/orders               → orders.ts
/api/auth                 → auth.ts (rate limited)
/api/wishlist             → wishlist.ts
/api/reviews              → reviews.ts
/api/promo                → promo.ts
/api/admin                → admin.ts
/api/admin/admins         → admins.ts
/api/admin/coupons        → admin-coupons.ts
/api/settings             → settings.ts
/api/profile              → profile.ts
/api/contact              → contact.ts
/api/coupons              → coupons-user.ts
/api/brands               → brands.ts (via router.use("/", ...))
/api/testimonials         → testimonials.ts (via router.use("/", ...))
/api/tryon                → tryon.ts
/api/outfits              → outfits.ts
```

### Build Process

1. `node ./build.mjs` — esbuild bundles all TypeScript into `dist/index.mjs` (CJS-compatible ESM).
2. Produces `dist/pino-worker.mjs` and related pino files as separate chunks.
3. Source maps generated alongside the bundle.
4. On startup: validates `PORT` env var, starts birthday cron, optionally sends one-time admin credentials email.

---

## 5. Database Schema

All tables use Drizzle ORM with PostgreSQL. Push schema with `pnpm --filter @workspace/db run push`.

### 5.1 `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | Auto-increment |
| `email` | `text` | NOT NULL, UNIQUE | Login identifier |
| `password_hash` | `text` | NOT NULL, DEFAULT "" | Empty for OAuth-only accounts |
| `name` | `text` | NOT NULL | Display name |
| `phone` | `text` | nullable | Phone number |
| `role` | `text` | NOT NULL, DEFAULT "customer" | "customer" or "admin" |
| `loyalty_points` | `integer` | DEFAULT 0 | Accumulated purchase points |
| `auth_provider` | `text` | DEFAULT "email" | "email", "google", "facebook", etc. |
| `auth_provider_id` | `text` | nullable | OAuth provider's user ID |
| `avatar_url` | `text` | nullable | Profile photo URL |
| `birth_date` | `text` | nullable | ISO date string (YYYY-MM-DD) |
| `birthday_coupon_year` | `integer` | DEFAULT 0 | Last year birthday coupon was issued |
| `city` | `text` | nullable | City for delivery defaults |
| `governorate` | `text` | nullable | One of 27 Egyptian governorates |
| `address` | `text` | nullable | Street address |
| `instagram_handle` | `text` | nullable | Social handle |
| `facebook_url` | `text` | nullable | Social link |
| `tiktok_handle` | `text` | nullable | Social handle |
| `whatsapp_social` | `text` | nullable | WhatsApp number |
| `x_handle` | `text` | nullable | Twitter/X handle |
| `is_profile_complete` | `integer` | DEFAULT 0 | 0/1 flag |
| `is_priority` | `integer` | DEFAULT 0 | 0/1 VIP flag |
| `priority_granted_at` | `text` | nullable | ISO timestamp |
| `is_admin` | `integer` | DEFAULT 0 | 0/1 admin flag |
| `admin_created_by` | `integer` | nullable | FK to users.id |
| `admin_created_at` | `text` | nullable | ISO timestamp |
| `permissions` | `text` | DEFAULT "{}" | JSON object of granular permissions |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.2 `categories`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `name` | `text` | NOT NULL | English name |
| `name_ar` | `text` | nullable | Arabic name |
| `slug` | `text` | NOT NULL, UNIQUE | URL-friendly identifier |
| `image` | `text` | nullable | Category hero image |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.3 `products`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `name` | `text` | NOT NULL | English name |
| `name_ar` | `text` | nullable | Arabic name |
| `description` | `text` | nullable | English description |
| `description_ar` | `text` | nullable | Arabic description |
| `price` | `real` | NOT NULL | Regular price (EGP) |
| `sale_price` | `real` | nullable | Discounted price |
| `discount_label` | `text` | nullable | e.g. "20% OFF" |
| `category_id` | `integer` | NOT NULL, FK → categories | |
| `images` | `jsonb` | DEFAULT `[]` | Array of image URLs (max 5) |
| `sizes` | `jsonb` | DEFAULT `[]` | Available sizes |
| `colors` | `jsonb` | DEFAULT `[]` | Available colours |
| `stock` | `integer` | NOT NULL, DEFAULT 0 | Current inventory |
| `material` | `text` | nullable | Materials description |
| `model_url` | `text` | nullable | 3D model URL for AR viewer |
| `is_new` | `boolean` | DEFAULT true | "New" badge |
| `is_sale` | `boolean` | DEFAULT false | "Sale" badge |
| `is_featured` | `boolean` | DEFAULT false | Shown in featured section |
| `is_hidden` | `boolean` | DEFAULT false | Excluded from public listing |
| `sold_count` | `integer` | DEFAULT 0 | Cumulative units sold |
| `rating` | `real` | nullable | Cached average rating |
| `review_count` | `integer` | DEFAULT 0 | Cached review count |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.4 `orders`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `user_id` | `integer` | nullable, FK → users | NULL for guest orders |
| `status` | `text` | NOT NULL, DEFAULT "pending" | pending/confirmed/packed/shipped/delivered/cancelled |
| `payment_method` | `text` | nullable | "cod", "card", etc. |
| `payment_status` | `text` | DEFAULT "pending" | "pending", "partial", "paid" |
| `items` | `jsonb` | DEFAULT `[]` | Snapshot of order items at time of purchase |
| `full_name` | `text` | nullable | |
| `phone` | `text` | nullable | |
| `email` | `text` | nullable | For confirmation email |
| `governorate` | `text` | nullable | Delivery governorate |
| `address` | `text` | nullable | Street address |
| `subtotal` | `real` | NOT NULL, DEFAULT 0 | Pre-discount total |
| `shipping` | `real` | NOT NULL, DEFAULT 0 | Shipping fee |
| `discount` | `real` | NOT NULL, DEFAULT 0 | Coupon discount amount |
| `total` | `real` | NOT NULL, DEFAULT 0 | Final charged amount |
| `promo_code` | `text` | nullable | Applied promo code |
| `cod_down_payment` | `real` | DEFAULT 0 | COD upfront payment |
| `cod_down_payment_status` | `text` | DEFAULT "pending" | |
| `cod_down_payment_method` | `text` | nullable | |
| `amount_due_on_delivery` | `real` | DEFAULT 0 | Remaining COD balance |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

**Note:** Order `items` is a JSONB snapshot (productId, productName, quantity, size, color, price, image). Product data is snapshotted at order time to prevent price drift.

### 5.5 `reviews`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `product_id` | `integer` | NOT NULL, FK → products | |
| `user_id` | `integer` | NOT NULL, FK → users | |
| `rating` | `integer` | NOT NULL | 1–5 |
| `comment` | `text` | nullable | |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.6 `wishlist`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `user_id` | `integer` | NOT NULL, FK → users | |
| `product_id` | `integer` | NOT NULL, FK → products | |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.7 `discount_codes`

Global, reusable promo codes managed by admin.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `code` | `text` | NOT NULL, UNIQUE | Uppercase code |
| `discount_type` | `text` | NOT NULL, DEFAULT "percentage" | "percentage", "fixed", "free_shipping" |
| `discount_value` | `real` | NOT NULL | Percent or EGP amount |
| `min_order_amount` | `real` | DEFAULT 0 | Minimum cart total |
| `is_active` | `integer` | DEFAULT 1 | 0/1 flag |
| `usage_count` | `integer` | DEFAULT 0 | Times validated |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.8 `coupons`

Single-use, user-specific coupons (primarily birthday coupons).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `code` | `text` | NOT NULL, UNIQUE | Auto-generated or admin-created |
| `discount_percent` | `integer` | DEFAULT 20 | Percentage discount |
| `user_id` | `integer` | nullable | Assigned to a specific user |
| `expires_at` | `text` | nullable | ISO timestamp |
| `used` | `boolean` | DEFAULT false | One-time use flag |
| `source` | `text` | DEFAULT "manual" | "birthday", "manual", "offer" |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.9 `settings`

Key-value store for all site configuration.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `key` | `text` | PRIMARY KEY | Setting identifier |
| `value` | `text` | NOT NULL | JSON-serialised config |

**Known keys:**
- `smtp_settings` — SMTP connection config (JSON)
- `contact_settings` — Store contact info (JSON)
- `social_media` — Social platform links (JSON)
- `cod_down_payment` — COD down payment amount (string integer)
- `hero_settings` — Hero section content (JSON)
- `admin_email_sent` — One-time admin email flag ("true")

### 5.10 `brands`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `name` | `text` | NOT NULL | Brand name |
| `logo_url` | `text` | nullable | Logo image URL |
| `website_url` | `text` | nullable | Brand website |
| `display_order` | `integer` | DEFAULT 0 | Carousel sort order |
| `active` | `integer` | DEFAULT 1 | 0/1 visibility flag |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.11 `outfits`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `name` | `text` | NOT NULL | English name |
| `name_ar` | `text` | nullable | Arabic name |
| `occasion` | `text` | NOT NULL, DEFAULT "casual" | "casual", "formal", "evening", etc. |
| `description` | `text` | nullable | |
| `description_ar` | `text` | nullable | |
| `cover_image` | `text` | nullable | Hero image URL |
| `is_published` | `boolean` | DEFAULT false | Visibility on storefront |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.12 `outfit_items`

Junction table linking outfits to products.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `outfit_id` | `integer` | NOT NULL, FK → outfits (CASCADE DELETE) | |
| `product_id` | `integer` | NOT NULL, FK → products (CASCADE DELETE) | |
| `role` | `text` | DEFAULT "accessory" | Item role in the outfit |
| `display_order` | `integer` | DEFAULT 0 | Sort order within outfit |

### 5.13 `saved_looks`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `user_id` | `integer` | NOT NULL, FK → users (CASCADE DELETE) | |
| `outfit_id` | `integer` | NOT NULL, FK → outfits (CASCADE DELETE) | |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

**Unique constraint:** `(user_id, outfit_id)` — prevents duplicate saves.

### 5.14 `testimonials`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `customer_name` | `text` | NOT NULL | |
| `customer_city` | `text` | nullable | |
| `customer_avatar_url` | `text` | nullable | |
| `rating` | `integer` | DEFAULT 5 | 1–5 |
| `review_text` | `text` | NOT NULL | English text |
| `review_text_ar` | `text` | nullable | Arabic text |
| `product_name` | `text` | nullable | Referenced product |
| `verified_purchase` | `integer` | DEFAULT 1 | 0/1 flag |
| `featured` | `integer` | DEFAULT 1 | 0/1 homepage display flag |
| `display_order` | `integer` | DEFAULT 0 | Sort order |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.15 `contact_messages`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PRIMARY KEY | |
| `name` | `text` | NOT NULL | Sender name (max 100 chars) |
| `email` | `text` | NOT NULL | Sender email (max 254 chars) |
| `phone` | `text` | nullable | Max 20 chars |
| `subject` | `text` | NOT NULL | Max 200 chars |
| `message` | `text` | NOT NULL | Max 2000 chars |
| `is_read` | `boolean` | DEFAULT false | Admin read status |
| `tracking_ref` | `text` | nullable | Auto-generated "MU-XXXXXX" ref |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | |

### 5.16 Example Records Per Table

Representative rows showing the data shape for each table.

#### `users`
```json
{
  "id": 1,
  "email": "<admin-email@example.com>",
  "passwordHash": "$2a$10$...",
  "name": "MU Admin",
  "phone": null,
  "role": "admin",
  "loyaltyPoints": 0,
  "authProvider": "email",
  "authProviderId": null,
  "avatarUrl": null,
  "birthDate": null,
  "birthdayCouponYear": 0,
  "governorate": null,
  "city": null,
  "address": null,
  "instagramHandle": null,
  "isProfileComplete": 0,
  "isPriority": 0,
  "isAdmin": 1,
  "adminCreatedBy": null,
  "permissions": "{}",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

#### `categories`
```json
{ "id": 1, "name": "Heels", "nameAr": "كعب عالي", "slug": "heels", "image": "/uploads/cat-heels.jpg", "createdAt": "2026-01-01T00:00:00.000Z" }
```

#### `products`
```json
{
  "id": 1,
  "name": "Nile Heel",
  "nameAr": "كعب النيل",
  "description": "Handcrafted leather heel inspired by the Nile.",
  "descriptionAr": "كعب جلدي مصنوع يدوياً مستوحى من النيل.",
  "price": 1200,
  "salePrice": 950,
  "discountLabel": "21% OFF",
  "categoryId": 1,
  "images": ["/uploads/nile-heel-1.jpg", "/uploads/nile-heel-2.jpg"],
  "sizes": ["36","37","38","39","40"],
  "colors": ["black","nude","gold"],
  "stock": 24,
  "material": "Genuine leather upper, padded insole",
  "modelUrl": null,
  "isNew": false,
  "isSale": true,
  "isFeatured": true,
  "isHidden": false,
  "soldCount": 112,
  "rating": 4.7,
  "reviewCount": 34,
  "createdAt": "2026-02-15T10:00:00.000Z"
}
```

#### `orders`
```json
{
  "id": 101,
  "userId": 42,
  "status": "delivered",
  "paymentMethod": "cod",
  "paymentStatus": "paid",
  "items": [
    { "productId": 1, "productName": "Nile Heel", "quantity": 1, "size": "38", "color": "black", "price": 950, "image": "/uploads/nile-heel-1.jpg" }
  ],
  "fullName": "Fatma Ahmed",
  "phone": "+201012345678",
  "email": "fatma@example.com",
  "governorate": "Cairo",
  "address": "12 Nile St, Heliopolis",
  "subtotal": 950,
  "shipping": 0,
  "discount": 190,
  "total": 760,
  "promoCode": "MU20",
  "codDownPayment": 50,
  "codDownPaymentStatus": "paid",
  "codDownPaymentMethod": "instapay",
  "amountDueOnDelivery": 710,
  "createdAt": "2026-05-01T14:30:00.000Z"
}
```

#### `reviews`
```json
{ "id": 55, "productId": 1, "userId": 42, "rating": 5, "comment": "Absolutely gorgeous, fits perfectly!", "createdAt": "2026-05-03T09:00:00.000Z" }
```

#### `wishlist`
```json
{ "id": 12, "userId": 42, "productId": 1, "createdAt": "2026-04-20T08:00:00.000Z" }
```

#### `discount_codes`
```json
{ "id": 1, "code": "MU20", "discountType": "percentage", "discountValue": 20, "minOrderAmount": 0, "isActive": 1, "usageCount": 87, "createdAt": "2026-01-01T00:00:00.000Z" }
```

#### `coupons`
```json
{ "id": 5, "code": "BDAY-A1B2C3", "discountPercent": 25, "userId": 42, "expiresAt": "2026-08-15T23:59:59.000Z", "used": false, "source": "birthday", "createdAt": "2026-08-14T00:00:00.000Z" }
```

#### `settings`
```json
{ "key": "smtp_settings", "value": "{\"host\":\"smtp.example.com\",\"port\":587,\"secure\":false,\"user\":\"<store-email@example.com>\",\"pass\":\"<app-password>\",\"from\":\"MU Store <<store-email@example.com>>\"}" }
```

#### `brands`
```json
{ "id": 1, "name": "Steve Madden", "logoUrl": null, "websiteUrl": "https://stevemadden.com", "displayOrder": 4, "active": 1, "createdAt": "2026-01-01T00:00:00.000Z" }
```

#### `outfits`
```json
{ "id": 3, "name": "Evening Elegance", "nameAr": "أناقة المساء", "occasion": "evening", "description": "A curated formal evening look.", "descriptionAr": "إطلالة مسائية رسمية منتقاة.", "coverImage": "/uploads/outfit3.jpg", "isPublished": true, "createdAt": "2026-03-10T00:00:00.000Z" }
```

#### `outfit_items`
```json
{ "id": 7, "outfitId": 3, "productId": 1, "role": "shoes", "displayOrder": 0 }
```

#### `saved_looks`
```json
{ "id": 2, "userId": 42, "outfitId": 3, "createdAt": "2026-05-10T12:00:00.000Z" }
```

#### `testimonials`
```json
{
  "id": 1,
  "customerName": "نور أحمد",
  "customerCity": "القاهرة",
  "customerAvatarUrl": null,
  "rating": 5,
  "reviewText": "The quality is stunning — soft genuine leather and a perfect finish.",
  "reviewTextAr": "الجودة رائعة — جلد طبيعي ناعم وتشطيب مثالي.",
  "productName": "Beige Leather Heels",
  "verifiedPurchase": 1,
  "featured": 1,
  "displayOrder": 0,
  "createdAt": "2026-01-15T00:00:00.000Z"
}
```

#### `contact_messages`
```json
{
  "id": 8,
  "name": "Fatma Ahmed",
  "email": "fatma@example.com",
  "phone": "+201012345678",
  "subject": "Order status inquiry",
  "message": "I placed an order 3 days ago and haven't received a shipping update.",
  "isRead": false,
  "trackingRef": "MU-M1A2B3C4",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

---

## 6. Auth & Security

### JWT Token Flow

```
Client                     API Server
  │                              │
  ├──POST /api/auth/login───────►│
  │   { email, password }        │  1. Validate input (Zod)
  │                              │  2. Look up user by email
  │                              │  3. bcrypt.compare(password, hash)
  │◄──{ token, user }───────────┤  4. jwt.sign({ id, role }, JWT_SECRET, 7d)
  │                              │
  │  Store token in localStorage │
  │                              │
  ├──GET /api/auth/me────────────►│
  │   Authorization: Bearer <t>  │  5. jwt.verify(token, JWT_SECRET)
  │◄──{ user profile }──────────┤  6. Return user from DB
```

### Token Storage

- **Key:** `mu_token` (localStorage)
- **User cache:** `mu_user` (localStorage, JSON-serialised)
- **Expiry:** 7 days
- **Format:** `Authorization: Bearer <token>` on all authenticated requests

### Middleware Functions (`lib/auth.ts`)

| Function | Behaviour |
|---|---|
| `requireAuth` | Extracts Bearer token, verifies JWT, attaches `req.user = { id, role }`. Returns 401 if missing or invalid. |
| `requireAdmin` | Calls `requireAuth` then checks `req.user.role === "admin"`. Returns 403 if not admin. |
| `optionalAuth` | Extracts and verifies Bearer token if present. Never rejects — used for guest+auth combined endpoints (cart, checkout). |

### Password Hashing

bcryptjs (pure JS, no native bindings) with salt rounds = 10. `hashPassword()` and `comparePassword()` wrappers in `lib/auth.ts`.

Social-only accounts have `passwordHash = ""`. Attempting email login on a social account returns a descriptive error indicating which provider to use.

### OAuth Flow

```
Browser → GET /api/auth/google
        → Passport redirects to Google
        → User authorises
        → Google redirects to /api/auth/google/callback
        → Passport calls upsertSocialUser() in passport.ts
        → User upserted in DB (link by provider ID or email)
        → Server redirects to /auth-callback?token=<jwt>&user=<json>
        → AuthCallbackPage.tsx extracts token + user, stores in localStorage
        → Redirect to / or /complete-profile
```

### Rate Limiting

| Endpoint Group | Window | Max Requests |
|---|---|---|
| `/api/auth/*` | 15 minutes | 20 |
| `/api/orders/*` | 60 seconds | 10 |

### Security Headers (set on every response)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Input Validation

All API mutations validate input with Zod schemas (generated from OpenAPI spec via `@workspace/api-zod`). Invalid input returns HTTP 400 with `{ error: "Invalid input" }`.

Contact form uses custom `sanitize()` helper with per-field length limits and email format validation.

### Admin Protection

The root admin account (the first admin seeded at bootstrap) is protected from deactivation and deletion in the `admins.ts` route.

### Known Security Considerations (from threat model)

- JWT_SECRET defaults to `mu-store-secret-2025` when not set in environment — **must** be overridden in production.
- SESSION_SECRET defaults to `mu-session-dev` — **must** be overridden in production.
- Cart totals and pricing come from the client at checkout; the server accepts the submitted total rather than recomputing from DB product prices. This is a known tradeoff for simplicity.
- Try-on endpoints have no auth — anyone can upload images and trigger the HF Space.

---

## 7. UI/UX Design System

### Colour Palette

| Token | Value | Usage |
|---|---|---|
| **Midnight Navy** | `#1A1A2E` | `foreground` — headers, primary buttons, dark panels |
| **Champagne Gold** | `#C9A96E` | Accent — brand logo, CTAs, borders, highlights |
| **Warm Cream** | `#F8F5F0` | `background` — page background in light mode |
| **Muted Stone** | `#888` | `muted-foreground` — secondary text |

Dark mode inverts foreground/background while preserving the gold accent.

### Typography

- **Headings:** Serif font (`font-serif`, Georgia/Times fallback) for luxury brand feel
- **Body:** System sans-serif via Tailwind default (`font-sans`)
- **Brand mark:** `MU` in bold serif, 4xl–7xl

### Tailwind CSS v4

Configuration via `@tailwindcss/vite` plugin. CSS variables define the colour tokens and are consumed via Tailwind utility classes (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.).

### Component Library (shadcn/ui primitives)

Located in `src/components/ui/`. Key components used:

`accordion`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `input`, `label`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `tooltip`

### Layout Patterns

- **Navbar:** Sticky top, `bg-background/95 backdrop-blur`. Shows logo, nav links, search icon, language switcher, theme toggle, notification bell, cart icon (with count badge), and auth state (user avatar / login button).
- **Cart Drawer:** Slides in from the right using a Sheet component.
- **Product Grid:** Responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **Admin:** Full-width tab layout with `Tabs` component. Each tab renders a dedicated admin sub-page component.
- **Checkout:** Three-step wizard with progress indicator.
- **Login/Register:** Split-panel layout — decorative brand panel (left, hidden on mobile) + form panel (right).

### RTL & Arabic Support

- `RTL_LANGS = new Set(["ar", "fa", "ur"])`
- On language change: `document.documentElement.dir` toggled to `"rtl"` or `"ltr"`
- Arabic content stored in bilingual DB fields (`name_ar`, `description_ar`, etc.)
- i18next `t()` function used throughout for all UI strings

### Toast Notifications

Sonner `<Toaster richColors position="top-right" />`. Used for login success/failure, cart actions, checkout errors, form submissions.

### Mobile Responsiveness

- Navbar collapses on mobile; cart and account icons remain visible
- Product grid changes column count via Tailwind breakpoints
- Checkout form is single-column on mobile, two-column on desktop
- Admin tables become horizontally scrollable on narrow viewports

---

## 8. All Pages & Routes

### 8.1 Frontend Routes

| Path | Component | Auth Required | Description |
|---|---|---|---|
| `/` | `HomePage` | No | Hero, featured products, brands carousel, testimonials |
| `/products` | `ProductsPage` | No | Filterable product catalog |
| `/products/:id` | `ProductDetailPage` | No (review requires auth) | Product detail with gallery, variants, try-on |
| `/checkout` | `CheckoutPage` | No (optional) | 3-step checkout wizard |
| `/account` | `AccountPage` | Yes (redirects if unauthed) | Order history, loyalty points, wishlist |
| `/login` | `LoginPage` | No | Email + social login |
| `/register` | `RegisterPage` | No | Account registration |
| `/auth-callback` | `AuthCallbackPage` | No | OAuth redirect handler |
| `/complete-profile` | `ProfileCompletePage` | Yes | VIP profile completion wizard |
| `/contact` | `ContactPage` | No | Contact form |
| `/lookbook` | `LookbookPage` | No | Editorial lookbook |
| `/saved-looks` | `SavedLooksPage` | Yes | User's saved outfit looks |
| `/feed` | `FashionFeedPage` | No | Fashion inspiration feed |
| `/language` | `LanguageSelectPage` | No | Language selection screen — file exists in `src/pages/` but is **not registered** in `App.tsx`; the `LanguageGate` component is a passthrough no-op; the language switcher is in the Navbar instead |
| `/size-guide` | `SizeGuidePage` | No | Shoe/bag sizing reference |
| `/shipping` | `ShippingPolicyPage` | No | Shipping policy content |
| `/returns` | `ReturnsPolicyPage` | No | Returns policy content |
| `/privacy` | `PrivacyPolicyPage` | No | Privacy policy content |
| `/terms` | `TermsPage` | No | Terms & conditions |
| `/admin` | `AdminPage` | Admin only | Full admin dashboard |
| `*` | `NotFound` | No | 404 fallback |

### 8.2 Backend Routes

#### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/healthz` | None | Returns `{ status: "ok" }` |

#### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new user → returns token + user |
| POST | `/api/auth/login` | None | Login → returns token + user |
| GET | `/api/auth/me` | Bearer | Get current user profile |
| GET | `/api/auth/social-status` | Admin | OAuth provider configuration status |
| GET | `/api/auth/google` | None | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | None | Google OAuth callback |
| GET | `/api/auth/facebook` | None | Start Facebook OAuth flow |
| GET | `/api/auth/facebook/callback` | None | Facebook OAuth callback |
| GET | `/api/auth/instagram` | None | Instagram OAuth (routes through Facebook) |
| GET | `/api/auth/instagram/callback` | None | Instagram OAuth callback |
| GET | `/api/auth/twitter` | None | Start Twitter/X OAuth flow |
| GET | `/api/auth/twitter/callback` | None | Twitter OAuth callback |
| GET | `/api/auth/apple` | None | Start Apple Sign In flow |
| POST | `/api/auth/apple/callback` | None | Apple Sign In callback |

#### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | None | List products with filters |
| GET | `/api/products/:id` | None | Get single product |
| GET | `/api/products/:id/reviews` | None | Get product reviews |
| GET | `/api/products/:id/social-proof` | None | Recent purchases + total sold count for a product |
| GET | `/api/products/:id/recommendations` | None | Complementary product recommendations (scored by featured/rating/sales) |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/images` | Admin | Upload product images (multipart) |
| DELETE | `/api/products/:id/images/:imgIndex` | Admin | Delete a product image |

#### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | None | List all categories |

#### Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | None | Get current cart |
| POST | `/api/cart` | None | Add item to cart |
| PUT | `/api/cart/:productId` | None | Update cart item quantity/variant |
| DELETE | `/api/cart/:productId` | None | Remove item from cart |
| DELETE | `/api/cart` | None | Clear cart |

#### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/orders` | Bearer | List user's orders |
| POST | `/api/orders` | Optional | Create order (guest or authenticated) |
| GET | `/api/orders/:id` | Optional | Get order by ID |
| GET | `/api/orders/admin/all` | Admin | List all orders |
| PUT | `/api/orders/admin/:id/status` | Admin | Update order status |

#### Wishlist

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/wishlist` | Bearer | Get user's wishlist |
| POST | `/api/wishlist/:productId` | Bearer | Add product to wishlist |
| DELETE | `/api/wishlist/:productId` | Bearer | Remove product from wishlist |

#### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reviews` | Bearer | Create a product review |

#### Promo

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/promo/validate` | None | Validate a promo code |
| POST | `/api/promo/use` | Bearer | Mark user coupon as used |

#### Admin (Dashboard & Core)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | KPI summary |
| GET | `/api/admin/insights` | Admin | Revenue charts, top products, low stock |
| GET | `/api/admin/orders` | Admin | All orders |
| PUT | `/api/admin/orders/:id/status` | Admin | Update order status |
| GET | `/api/admin/customers` | Admin | All customers |
| PUT | `/api/admin/customers/:id/priority` | Admin | Toggle customer priority |

#### Admin — Admins

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/admins` | Admin | List all admins |
| POST | `/api/admin/admins` | Admin | Create new admin |
| PUT | `/api/admin/admins/:id/deactivate` | Admin | Deactivate admin (set role=customer) |
| DELETE | `/api/admin/admins/:id` | Admin | Delete admin |

#### Admin — Coupons

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/coupons` | Admin | List all user coupons |
| GET | `/api/admin/coupons/stats` | Admin | Coupon statistics |
| PUT | `/api/admin/coupons/:id/toggle-used` | Admin | Toggle coupon used status |
| PUT | `/api/admin/coupons/:id/extend` | Admin | Extend coupon expiry by 7 days |
| DELETE | `/api/admin/coupons/:id` | Admin | Delete coupon |
| DELETE | `/api/admin/coupons/bulk/expired` | Admin | Bulk delete expired coupons |

#### Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/settings/contact` | None | Get contact settings |
| POST | `/api/settings/contact` | Admin | Update contact settings |
| GET | `/api/settings/cod-down-payment` | None | Get COD down payment amount |
| POST | `/api/settings/cod-down-payment` | Admin | Update COD down payment |
| GET | `/api/settings/social` | None | Get social media links |
| POST | `/api/settings/social` | Admin | Update social media links |
| GET | `/api/settings/smtp` | Admin | Get SMTP config (password masked) |
| POST | `/api/settings/smtp` | Admin | Update SMTP config |
| POST | `/api/settings/smtp/test` | Admin | Send test email |
| GET | `/api/settings/hero` | None | Get hero section settings |
| POST | `/api/settings/hero` | Admin | Update hero section |

#### Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/profile/complete` | Bearer | Complete profile (VIP upgrade) |
| PUT | `/api/profile/socials` | Bearer | Update social handles |

#### Contact

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/contact` | None | Submit contact form |
| GET | `/api/contact/admin` | Admin | List all messages |
| PUT | `/api/contact/admin/:id/read` | Admin | Mark message as read |
| DELETE | `/api/contact/admin/:id` | Admin | Delete message |
| GET | `/api/contact/admin/stats` | Admin | Message statistics |

#### Outfits

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/outfits` | None | List outfits (published only, unless all=1) |
| GET | `/api/outfits/saved` | Bearer | User's saved looks |
| GET | `/api/outfits/:id` | None | Get outfit with items |
| POST | `/api/outfits/:id/save` | Bearer | Save an outfit |
| DELETE | `/api/outfits/:id/save` | Bearer | Unsave an outfit |
| POST | `/api/outfits` | Admin | Create outfit |
| PUT | `/api/outfits/:id` | Admin | Update outfit |
| DELETE | `/api/outfits/:id` | Admin | Delete outfit |

#### Try-On

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/tryon/upload` | None | Upload user photo → temp URL |
| GET | `/api/tryon/temp/:id` | None | Serve temp uploaded image |
| POST | `/api/tryon/start` | None | Start try-on via HF Space |
| GET | `/api/tryon/status/:predictionId` | None | Poll try-on prediction status |

#### User Coupons

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/coupons/mine` | Bearer | List the current user's coupons (with isActive/isExpired computed) |

#### Brands

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/brands` | None | List active brands (cached 10 min) |
| GET | `/api/admin/brands` | Admin | List all brands (including inactive) |
| POST | `/api/admin/brands` | Admin | Create brand |
| PUT | `/api/admin/brands/:id` | Admin | Update brand |
| DELETE | `/api/admin/brands/:id` | Admin | Delete brand |
| POST | `/api/admin/brands/reorder` | Admin | Bulk update display order — body: `{ order: [{ id, displayOrder }] }` |

#### Testimonials

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/testimonials` | None | List featured testimonials (cached 5 min) |
| GET | `/api/admin/testimonials` | Admin | List all testimonials |
| POST | `/api/admin/testimonials` | Admin | Create testimonial |
| PUT | `/api/admin/testimonials/:id` | Admin | Update testimonial |
| DELETE | `/api/admin/testimonials/:id` | Admin | Delete testimonial |

---

## 9. Full API Reference

Base URL: `/api` (all paths relative to this prefix)

All authenticated endpoints require `Authorization: Bearer <jwt_token>` header.

All error responses follow: `{ "error": "<message>" }`

### 9.1 Auth

#### `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "Fatma Ahmed",
  "phone": "+201012345678"
}
```

**Response 201:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "name": "Fatma Ahmed",
    "phone": "+201012345678",
    "role": "customer",
    "loyaltyPoints": 0,
    "createdAt": "2026-05-14T10:00:00.000Z"
  }
}
```

**Errors:** 400 — email already registered; 400 — invalid input

#### `POST /auth/login`

**Request:** `{ "email": "...", "password": "..." }`

**Response 200:** Same as register response

**Errors:** 401 — invalid credentials; 401 — account uses social sign-in

#### `GET /auth/me`

**Auth:** Required

**Response 200:**
```json
{
  "id": 42,
  "email": "user@example.com",
  "name": "Fatma Ahmed",
  "phone": "+201012345678",
  "role": "customer",
  "loyaltyPoints": 120,
  "avatarUrl": null,
  "isProfileComplete": 1,
  "isPriority": 1,
  "governorate": "Cairo",
  "city": "Heliopolis",
  "address": "12 Nile St",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

### 9.2 Health

#### `GET /healthz`

**Auth:** None

**Response 200:** `{ "status": "ok" }`

### 9.3 Categories

#### `GET /categories`

**Auth:** None

**Response 200:**
```json
[
  { "id": 1, "name": "Heels", "nameAr": "كعب عالي", "slug": "heels", "image": "/uploads/cat-heels.jpg", "productCount": 24 },
  { "id": 2, "name": "Bags",  "nameAr": "حقائب",    "slug": "bags",  "image": "/uploads/cat-bags.jpg",  "productCount": 18 }
]
```

**Notes:** Results cached in-memory for 10 minutes.

### 9.4 Products

#### `GET /products`

**Auth:** None

**Query params:**

| Param | Type | Example | Notes |
|---|---|---|---|
| `category` | string | `heels` | Category slug |
| `minPrice` | number | `700` | Minimum price (EGP) |
| `maxPrice` | number | `2500` | Maximum price (EGP) |
| `size` | string | `38` | JSONB containment filter |
| `color` | string | `black` | JSONB containment filter |
| `sort` | enum | `price_asc` | `newest` / `price_asc` / `price_desc` / `best_selling` / `top_rated` |
| `page` | integer | `1` | Default 1 |
| `limit` | integer | `12` | Default 12 |
| `search` | string | `leather` | Case-insensitive ILIKE on name and description |

**Response 200:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Nile Heel",
      "nameAr": "كعب النيل",
      "price": 1200,
      "salePrice": 950,
      "categoryId": 1,
      "categoryName": "Heels",
      "images": ["/uploads/abc.jpg"],
      "sizes": ["36", "37", "38", "39"],
      "colors": ["black", "nude"],
      "stock": 15,
      "isNew": false,
      "isSale": true,
      "isFeatured": true,
      "rating": 4.5,
      "reviewCount": 12,
      "soldCount": 87,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 12
}
```

**Notes:** Hidden products (`isHidden = true`) are excluded. Average rating and review count are computed live from the `reviews` table.

#### `GET /products/:id`

**Auth:** None

**Response 200:** Single product object (same shape as list item; includes `description`, `descriptionAr`, `material`, `modelUrl`).

**Errors:** 404 — product not found

#### `GET /products/:id/reviews`

**Auth:** None

**Response 200:**
```json
[
  { "id": 55, "productId": 1, "userId": 42, "userName": "Fatma Ahmed", "rating": 5, "comment": "Gorgeous!", "createdAt": "2026-05-03T09:00:00.000Z" }
]
```

#### `POST /products` (Admin)

**Auth:** Admin

**Request:**
```json
{
  "name": "Nile Heel",
  "nameAr": "كعب النيل",
  "description": "Handcrafted leather heel.",
  "price": 1200,
  "salePrice": 950,
  "categoryId": 1,
  "images": [],
  "sizes": ["36","37","38"],
  "colors": ["black","nude"],
  "stock": 20,
  "isNew": true,
  "isSale": false,
  "isFeatured": false
}
```

**Required fields:** `name`, `price`, `categoryId`, `stock`

**Response 201:** Created product object

#### `PUT /products/:id` (Admin)

**Auth:** Admin

**Request:** Same shape as `POST /products` (any subset of fields)

**Response 200:** Updated product object

**Errors:** 404 — product not found

#### `DELETE /products/:id` (Admin)

**Auth:** Admin

**Response 204:** No body

### 9.5 Orders

#### `GET /orders`

**Auth:** Bearer

**Response 200:** Array of order objects for the authenticated user, newest first.

#### `POST /orders`

**Request:**
```json
{
  "items": [
    {
      "productId": 1,
      "productName": "Nile Heel",
      "quantity": 2,
      "size": "38",
      "color": "black",
      "price": 950,
      "image": "/uploads/abc.jpg"
    }
  ],
  "fullName": "Fatma Ahmed",
  "phone": "+201012345678",
  "email": "fatma@example.com",
  "governorate": "Cairo",
  "address": "12 Nile St",
  "paymentMethod": "cod",
  "promoCode": "MU20",
  "subtotal": 1900,
  "shipping": 50,
  "discount": 380,
  "total": 1570,
  "codDownPayment": 50,
  "codDownPaymentStatus": "pending",
  "codDownPaymentMethod": "instapay"
}
```

**Response 201:** Full order object

**Errors:** 400 — invalid input; 400 — cart is empty

#### `GET /orders/:id`

**Auth:** Bearer

**Response 200:** Single order object. Returns 403 if the order belongs to a different user (unless caller is admin).

**Errors:** 404 — order not found; 403 — not owner

### 9.6 Cart

**Cart key logic (server-side):**
- `Authorization: Bearer <token>` present → key is `user:<token>` (stable for authenticated users).
- Cookie `cart_sid` present (no auth) → key is `sid:<cookie-value>`.
- Neither present → ephemeral random string per request (the server **never** writes `cart_sid`, so anonymous carts without the cookie are lost between requests).

**Note:** The React `CartContext` in the frontend manages its own in-memory cart independently of the server-side cart. They are separate systems.

#### `GET /cart`

**Auth:** None

**Response 200:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "size": "38",
      "color": "black",
      "product": {
        "id": 1,
        "name": "Nile Heel",
        "nameAr": "كعب النيل",
        "price": 1200,
        "salePrice": 950,
        "images": ["/uploads/abc.jpg"],
        "sizes": ["36","37","38","39"],
        "colors": ["black","nude"],
        "stock": 15
      }
    }
  ],
  "subtotal": 1900,
  "shipping": 50,
  "discount": 0,
  "total": 1950,
  "promoCode": null
}
```

#### `POST /cart`

**Request:**
```json
{ "productId": 1, "quantity": 1, "size": "38", "color": "black" }
```

**Validation:** `quantity` 1–20, `size` string 1–20 chars, `color` string 1–50 chars.

**Response 200:** Updated cart object (same shape as GET)

**Errors:** 400 — invalid cart item

#### `PUT /cart/:productId`

**Request:** `{ "quantity": 3 }` (optionally `"size"` and `"color"` to update the variant)

**Notes:** Setting `quantity: 0` removes the item.

**Response 200:** Updated cart object

#### `DELETE /cart/:productId`

**Response 200:** Updated cart object

#### `DELETE /cart`

**Response 200:** `{ "items": [], "subtotal": 0, "shipping": 0, "discount": 0, "total": 0, "promoCode": null }`

### 9.7 Wishlist

**Auth:** Bearer required for all wishlist endpoints.

#### `GET /wishlist`

**Response 200:** Array of product objects (same shape as product listing items).

#### `POST /wishlist/:productId`

**Response 200:** `{ "success": true }`

**Notes:** Idempotent — silently ignores if already in wishlist.

#### `DELETE /wishlist/:productId`

**Response 200:** `{ "success": true }`

### 9.8 Reviews

#### `POST /reviews`

**Auth:** Bearer

**Request:**
```json
{ "productId": 1, "rating": 5, "comment": "Absolutely gorgeous shoes!" }
```

**Response 201:**
```json
{
  "id": 99,
  "productId": 1,
  "userId": 42,
  "userName": "Fatma Ahmed",
  "rating": 5,
  "comment": "Absolutely gorgeous shoes!",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

**Errors:** 400 — invalid input (rating not 1–5, productId missing)

### 9.9 Profile

#### `POST /profile/complete`

**Auth:** Bearer

**Request:**
```json
{
  "name": "Fatma Ahmed",
  "phone": "+201012345678",
  "birthDate": "1995-08-15",
  "governorate": "Cairo",
  "city": "Heliopolis",
  "address": "12 Nile St",
  "instagramHandle": "@fatma_style",
  "facebookUrl": null,
  "tiktokHandle": null,
  "whatsappSocial": null,
  "xHandle": null
}
```

**Response 200:**
```json
{ "ok": true, "bonusPoints": 100, "isPriority": true }
```

**Notes:** `bonusPoints` is 100 on first completion, 0 on subsequent calls. Sends VIP welcome email on first completion.

#### `PUT /profile/socials`

**Auth:** Bearer

**Request:** Any subset of `{ instagramHandle, facebookUrl, tiktokHandle, whatsappSocial, xHandle }`

**Response 200:** `{ "ok": true }`

### 9.10 Promo Validation

#### `POST /promo/validate`

**Request:** `{ "code": "MU20", "cartTotal": 1500 }`

**Response 200:**
```json
{
  "code": "MU20",
  "discountType": "percentage",
  "discountValue": 20,
  "discountAmount": 300
}
```

**Errors:** 404 — invalid or expired code; 400 — coupon already used

**Logic:** Checks `discount_codes` table first (global reusable codes), then `coupons` table (single-use user-specific coupons). Returns the first match.

#### `POST /promo/use`

**Auth:** Bearer

**Request:** `{ "couponId": 5 }`

**Notes:** `couponId` is the integer `id` from the `coupons` table. The `validate` endpoint returns `couponId` in its response when a user-specific coupon is matched — the client should capture that value and pass it here after the order is placed. Only marks rows in the `coupons` table as used. Global `discount_codes` rows have no used state and are not affected.

**Response 200:** `{ "ok": true }`

**Errors:** 400 — missing `couponId`

### 9.11 User Coupons

#### `GET /coupons/mine`

**Auth:** Bearer

**Response 200:**
```json
[
  {
    "id": 5,
    "code": "BDAY-A1B2C3",
    "discountPercent": 25,
    "userId": 42,
    "expiresAt": "2026-08-15T23:59:59.000Z",
    "used": false,
    "source": "birthday",
    "createdAt": "2026-08-14T00:00:00.000Z",
    "isExpired": false,
    "isActive": true
  }
]
```

### 9.12 Settings (Public)

#### `GET /settings/contact`

**Response 200:**
```json
{
  "phone": "+201012345678",
  "email": "hello@mu-store.com",
  "address": "Cairo, Egypt",
  "whatsapp": "+201012345678",
  "whatsappEnabled": true,
  "workingHours": "Mon–Sat 10am–8pm"
}
```

#### `GET /settings/cod-down-payment`

**Response 200:** `{ "amount": 50 }`

#### `GET /settings/social`

**Response 200:**
```json
{
  "instagram": "https://instagram.com/mu_brand",
  "facebook": null,
  "tiktok": null,
  "twitter": null
}
```

#### `GET /settings/hero`

**Response 200:**
```json
{
  "title": "Where Every Step Tells Your Story",
  "titleAr": "حيث كل خطوة تحكي قصتك",
  "subtitle": "Luxury Egyptian handcrafted shoes & bags",
  "backgroundImage": "/uploads/hero.jpg",
  "ctaText": "Shop Now",
  "ctaLink": "/products"
}
```

### 9.13 Contact

#### `POST /contact`

**Request:**
```json
{
  "name": "Fatma Ahmed",
  "email": "fatma@example.com",
  "phone": "+201012345678",
  "subject": "Order inquiry",
  "message": "I have a question about my order..."
}
```

**Response 201:** `{ "ok": true, "trackingRef": "MU-M1A2B3C4" }`

**Notes:** Sends admin notification email + auto-reply confirmation to customer.

**Errors:** 400 — missing required fields; 400 — invalid email format

### 9.14 Outfits

#### `GET /outfits`

**Query params:** `occasion` (filter by occasion slug), `productId` (outfits containing this product), `all=1` (include unpublished — admin only in practice)

**Response 200:** Array of outfit objects.

#### `GET /outfits/:id`

**Response 200:**
```json
{
  "id": 3,
  "name": "Evening Elegance",
  "nameAr": "أناقة المساء",
  "occasion": "evening",
  "description": "A complete look for formal evenings",
  "coverImage": "/uploads/outfit3.jpg",
  "isPublished": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "items": [
    {
      "id": 10,
      "outfitId": 3,
      "productId": 1,
      "role": "shoes",
      "displayOrder": 0,
      "product": { "id": 1, "name": "Nile Heel", "price": 1200, "images": [...] }
    }
  ]
}
```

#### `GET /outfits/saved`

**Auth:** Bearer

**Response 200:** Array of outfit objects (same shape as detail) each including `savedId`.

#### `POST /outfits/:id/save` / `DELETE /outfits/:id/save`

**Auth:** Bearer

**Response 200:** `{ "ok": true }`

### 9.15 Virtual Try-On

#### `POST /tryon/upload`

**Auth:** None

**Request:** `multipart/form-data` with field `userImage` (JPG/PNG/WebP, max 10 MB)

**Response 200:**
```json
{ "id": "a1b2c3d4...", "url": "https://domain.replit.app/api/tryon/temp/a1b2c3d4..." }
```

**Notes:** Image is optionally resized to 768×1024 via `sharp`. Stored in temp dir with 15-minute TTL.

#### `POST /tryon/start`

**Auth:** None

**Request:**
```json
{
  "userImageUrl": "https://domain.replit.app/api/tryon/temp/a1b2c3d4",
  "productImageUrl": "/uploads/product1.jpg",
  "productName": "Nile Heel"
}
```

**Response 200:** `{ "predictionId": "hf-a1b2c3d4", "provider": "huggingface" }`

#### `GET /tryon/status/:predictionId`

**Auth:** None

**Response 200:**
```json
{
  "status": "completed",
  "resultImageUrl": "https://yisol-idm-vton.hf.space/gradio_api/file=...",
  "error": null,
  "progress": 100
}
```

**Status values:** `queued`, `processing`, `completed`, `failed`, `demo`

### 9.16 Admin Dashboard

#### `GET /admin/dashboard`

**Auth:** Admin

**Response 200:**
```json
{
  "totalRevenue": 125400.50,
  "totalOrders": 342,
  "totalProducts": 87,
  "totalCustomers": 1204,
  "priorityCount": 98,
  "ordersToday": 14,
  "revenueByCategory": [
    { "category": "Heels", "revenue": 54200 }
  ],
  "recentOrders": [...],
  "ordersByStatus": [
    { "status": "pending", "count": 12 },
    { "status": "delivered", "count": 210 }
  ]
}
```

#### `GET /admin/orders`

**Auth:** Admin

**Response 200:** Array of all orders across all customers, newest first.

**Notes:** Used by the admin Orders page. Includes full order objects with items, delivery info, payment status, and COD fields.

#### `PUT /admin/orders/:id/status`

**Auth:** Admin

**Request:** `{ "status": "shipped" }`

**Valid status values:** `pending` | `confirmed` | `packed` | `shipped` | `delivered` | `cancelled`

**Response 200:** Updated order object.

**Errors:** 400 — invalid status value; 404 — order not found

#### `GET /admin/customers`

**Auth:** Admin

**Response 200:** Array of all registered users (all roles).

**Example response item:**
```json
{
  "id": 42,
  "email": "customer@example.com",
  "name": "Fatma Ahmed",
  "phone": "+201012345678",
  "role": "customer",
  "loyaltyPoints": 120,
  "createdAt": "2026-01-15T09:00:00.000Z"
}
```

**Notes:** Admins see all columns returned by the `User` schema. Used by the admin Customers page for priority/admin management.

---

### 9.17 Products — Social Proof & Recommendations

#### `GET /products/:id/social-proof`

**Auth:** None

**Response 200:**
```json
{ "recentPurchases": 7, "totalSold": 342 }
```

**Notes:** `recentPurchases` = distinct orders containing this product in the last 24 hours. Both values computed live via JSONB query on the `orders` table.

#### `GET /products/:id/recommendations`

**Auth:** None

**Response 200:** Array of up to 6 product objects.

**Logic:** Finds complementary-category products (bags ↔ shoes) in 0.4×–2.5× the current product's price range, scored by featured flag (+3), rating ≥4.5 (+2), sold count >50 (+1), isNew (+1), isSale (+0.5). Returns top 6.

---

## 10. Deployment & DevOps

### Monorepo Structure

```
workspace/
├── artifacts/
│   ├── mu-store/          # React + Vite storefront
│   └── api-server/        # Express 5 API
├── lib/
│   ├── api-spec/          # OpenAPI YAML + codegen config
│   ├── api-client-react/  # Generated TanStack Query hooks
│   ├── api-zod/           # Generated Zod schemas
│   └── db/                # Drizzle ORM schema + migrations
├── scripts/               # Utility scripts
└── pnpm-workspace.yaml    # Workspace config, catalog, release age policy
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `PORT` | **Yes** | — | Server port (assigned by Replit workflow) |
| `JWT_SECRET` | Production | `mu-store-secret-2025` | JWT signing secret — change in production |
| `SESSION_SECRET` | Production | `mu-session-dev` | Session encryption key |
| `GOOGLE_CLIENT_ID` | Optional | — | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | — | Google OAuth |
| `FACEBOOK_APP_ID` | Optional | — | Facebook/Instagram OAuth |
| `FACEBOOK_APP_SECRET` | Optional | — | Facebook/Instagram OAuth |
| `TWITTER_API_KEY` | Optional | — | Twitter/X OAuth |
| `TWITTER_API_SECRET` | Optional | — | Twitter/X OAuth |
| `APPLE_CLIENT_ID` | Optional | — | Apple Sign In |
| `APPLE_TEAM_ID` | Optional | — | Apple Sign In |
| `APPLE_KEY_ID` | Optional | — | Apple Sign In |
| `APPLE_PRIVATE_KEY` | Optional | — | Apple Sign In |
| `EMAIL_USER` | Optional | — | Fallback SMTP user (Gmail) |
| `EMAIL_PASS` | Optional | — | Fallback SMTP password |
| `STORE_URL` | Optional | Auto-detected | Override canonical store URL for OAuth callbacks |
| `BASE_PATH` | Workflow | `/` | Vite base path (set by Replit workflow) |
| `NODE_ENV` | Auto | `development` | Controls CORS, debug mode |
| `REPLIT_DOMAINS` | Auto | — | Comma-separated production domains |

### Replit Workflows

```toml
# artifacts/api-server/.replit-artifact/artifact.toml
[[services]]
name = "API Server"
localPort = 8080
paths = ["/api"]

# artifacts/mu-store/.replit-artifact/artifact.toml
[[services]]
name = "web"
localPort = 20605
paths = ["/"]
```

All HTTP traffic routes through Replit's shared reverse proxy at `localhost:80`. Services must use their assigned `PORT` env var — never hard-code ports.

### Key Commands

```bash
# Development (run via Replit workflows, not directly)
pnpm --filter @workspace/api-server run dev    # Builds + starts API on $PORT
pnpm --filter @workspace/mu-store run dev      # Vite dev server on $PORT

# Type checking
pnpm run typecheck          # Full check (libs then artifacts)
pnpm run typecheck:libs     # tsc --build for composite libs only

# Building (production)
pnpm run build              # typecheck + build all packages

# Database
pnpm --filter @workspace/db run push          # Push schema to DB (dev)

# Code generation
pnpm --filter @workspace/api-spec run codegen # Regenerate hooks + Zod from OpenAPI
```

### Database Setup

1. Replit provisions a managed PostgreSQL database automatically.
2. `DATABASE_URL` is set as a secret by Replit.
3. Run `pnpm --filter @workspace/db run push` to create/sync schema tables.
4. No migration files — Drizzle Kit's `push` directly applies schema.

### Production Deployment (Replit)

1. Click "Deploy" or "Publish" in the Replit interface.
2. Replit builds each artifact and routes traffic via its global CDN/proxy.
3. `NODE_ENV=production` is set automatically.
4. CORS is restricted to `REPLIT_DOMAINS` in production mode.
5. Admin credentials email is sent once on first server startup (tracked via `settings` table).

---

## 11. How To Rebuild

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL database (connection URL)

### Step 1: Bootstrap Monorepo

```bash
git init mu-store && cd mu-store
pnpm init
# Set up pnpm-workspace.yaml with packages: [artifacts/*, lib/*, scripts]
# Add TypeScript, ESLint, Prettier to root devDependencies
pnpm install
```

### Step 2: Create Shared Libraries

```bash
# DB library
mkdir -p lib/db/src/schema
# Set up Drizzle ORM + drizzle-kit, define all 15 schema tables
# Export all tables from lib/db/src/index.ts

# API spec library
mkdir -p lib/api-spec
# Write openapi.yaml with all paths and schemas
# Add orval.config.ts to generate hooks and Zod schemas
# Run: pnpm --filter @workspace/api-spec run codegen

# Generated libraries are output to:
# lib/api-client-react/src/generated/   (TanStack Query hooks)
# lib/api-zod/src/generated/            (Zod validation schemas)
```

### Step 3: Build the API Server

```bash
mkdir -p artifacts/api-server/src/{routes,lib}
# Install: express, cors, pino, pino-http, jsonwebtoken, bcryptjs,
#          passport, passport-google-oauth20, passport-facebook,
#          passport-twitter, passport-apple, express-session,
#          express-rate-limit, multer, nodemailer, drizzle-orm, pg
# 
# Key files to create:
# lib/auth.ts    → JWT sign/verify, requireAuth/requireAdmin/optionalAuth
# lib/mailer.ts  → SMTP sendMail with DB config + ENV fallback
# lib/passport.ts → OAuth strategy registration
# lib/birthday.ts → Daily birthday coupon job
# lib/logger.ts  → Pino singleton
# app.ts         → Express app with full middleware stack
# index.ts       → Listen on PORT, start birthday job
# routes/index.ts → Mount all route modules
# + one route file per feature (auth, products, orders, cart, etc.)
```

### Step 4: Build the Storefront

```bash
mkdir -p artifacts/mu-store/src/{pages,components,lib,hooks,locales}
# Install: react, react-dom, vite, @vitejs/plugin-react, tailwindcss,
#          @tanstack/react-query, wouter, framer-motion, i18next,
#          react-i18next, react-hook-form, zod, sonner, lucide-react
#
# Key files:
# main.tsx      → ReactDOM.createRoot, mount <App>
# App.tsx       → QueryClientProvider + all context providers + Wouter router
# i18n.ts       → i18next setup with 12 locales, RTL handling
# lib/auth-context.tsx → AuthProvider with localStorage JWT persistence
# lib/cart-context.tsx → In-memory cart state
# + all page components and shared components
# vite.config.ts → base=BASE_PATH, port=PORT, host=0.0.0.0, allowedHosts=true
```

### Step 5: Configure Replit Artifacts

Each artifact needs `.replit-artifact/artifact.toml` with its service name, `localPort`, and `paths`. The `paths` value determines the reverse proxy routing.

### Step 6: Environment & Database

```bash
# Set secrets in Replit environment
DATABASE_URL=postgres://...
JWT_SECRET=<random 64-char string>
SESSION_SECRET=<random 64-char string>

# Push schema
pnpm --filter @workspace/db run push

# Seed initial data (admin user, categories, discount codes)
# Admin: INSERT INTO users (email, password_hash, name, role, is_admin) VALUES (...)
# Run bcrypt.hash("<strong-password>", 10) for the password hash
```

### Architecture Decisions Made

1. **JWT in localStorage** — Simple stateless auth; acceptable for an e-commerce site without super-sensitive data. Trade-off: XSS risk. Alternative: HTTP-only cookies.
2. **In-memory cart** — Avoids DB complexity for anonymous cart state. Trade-off: lost on restart. Alternative: DB-persisted cart or localStorage.
3. **No cart DB persistence** — Cart sync on login not implemented. Cart is managed client-side via CartContext.
4. **bcryptjs not bcrypt** — Avoids native build script in Replit. No functional difference.
5. **Drizzle push not migrate** — Suitable for development/Replit. For production with migrations, switch to `drizzle-kit generate` + `drizzle-kit migrate`.
6. **OpenAPI-first codegen** — All API hooks and validation schemas generated from the spec. Source of truth is `openapi.yaml`.

---

## 12. Codebase Intelligence

### Critical Files

| File | Why Critical |
|---|---|
| `artifacts/api-server/src/lib/auth.ts` | All auth middleware — change here breaks every protected route |
| `artifacts/api-server/src/app.ts` | Middleware stack — CORS, rate limiting, security headers all here |
| `artifacts/api-server/src/routes/orders.ts` | Revenue-critical; handles stock, loyalty, and email |
| `lib/api-spec/openapi.yaml` | Source of truth for all API shapes; drives codegen |
| `lib/db/src/schema/` | DB structure — changes require `push` |
| `artifacts/mu-store/src/lib/auth-context.tsx` | Frontend auth state — used by every protected page |
| `artifacts/mu-store/src/App.tsx` | Full routing tree and provider hierarchy |

### Business Logic Hotspots

- **Order creation** (`routes/orders.ts` line 48+): stock decrement, loyalty accrual, COD logic, confirmation email — all in one POST handler.
- **Promo validation** (`routes/promo.ts`): two-tier check (discount_codes → coupons) — order matters.
- **Birthday coupon job** (`lib/birthday.ts`): runs daily; checks `birth_date` and `birthday_coupon_year` to avoid duplicate issuance.
- **Cart pricing** (`routes/cart.ts` line 71): shipping threshold logic (free at ≥500 EGP).
- **OAuth upsert** (`lib/passport.ts` line 16): email-based account linking — handles placeholder emails for providers that don't share email.

### Known Technical Debt

| Issue | Location | Impact |
|---|---|---|
| Cart not persisted to DB | `routes/cart.ts` | Cart lost on server restart |
| Order total not recomputed server-side | `routes/orders.ts` | Client can submit arbitrary totals |
| Admin routes duplicated between `admin.ts` and `orders.ts` | Both files | Two paths to update order status |
| `req.log` not used in some route files | Various routes | Inconsistent logging; `console.log` still present in some places |
| No pagination on admin endpoints | `routes/admin.ts` | Performance degrades with large datasets |
| Try-on has no auth | `routes/tryon.ts` | Public endpoint that proxies to HF Space — DoS risk |
| JWT_SECRET has insecure default | `lib/auth.ts` | Logs a warning but does not fail in production |

### Testing Credentials

- **Admin:** configured via the bootstrap seed script — see `replit.md` for local dev credentials
- **Promo codes:** `MU20` (20% off), `FREESHIP` (free shipping), `WELCOME10` (10% off)

---

## 13. Complete Project Blueprint

```
MU Store — Full System Blueprint
═══════════════════════════════

BRAND
  Name        : MU
  Tagline     : "Where Every Step Tells Your Story"
  Products    : Luxury shoes & bags (700–2500 EGP)
  Market      : Egyptian women, premium segment
  Language    : Arabic (primary market) + 11 other languages

TECH STACK
  Frontend    : React 19 + Vite 7 + Tailwind CSS v4 + Framer Motion
  Routing     : Wouter (client-side, path-based)
  State       : TanStack Query (server) + React Context (auth, cart, theme)
  Backend     : Express 5 + Node.js 24 + TypeScript 5.9
  Database    : PostgreSQL + Drizzle ORM
  Auth        : JWT (7 days) + bcryptjs + Passport.js OAuth
  Email       : Nodemailer (SMTP, configurable via DB settings)
  Build       : Vite (frontend) + esbuild (backend)
  Monorepo    : pnpm workspaces

ARTIFACTS
  mu-store    → Storefront SPA (path: /, port: 20605)
  api-server  → REST API (path: /api, port: 8080)

DATABASES (15 tables)
  users               customers + admins + OAuth accounts
  categories          product taxonomy
  products            catalogue with bilingual content
  orders              order records + JSONB item snapshots
  reviews             product ratings and comments
  wishlist            user-product save list
  discount_codes      global reusable promo codes
  coupons             user-specific single-use coupons
  settings            key-value site configuration
  brands              brand carousel entries
  outfits             curated complete-the-look sets
  outfit_items        outfit → product junction
  saved_looks         user → outfit junction
  testimonials        homepage social proof
  contact_messages    contact form inbox

API SURFACE (44 routes, 18 resource groups)
  Public    : products, categories, cart, promo, contact, settings/social,
              settings/contact, settings/hero, brands, testimonials,
              tryon, outfits, healthz
  Customer  : auth/me, orders, wishlist, reviews, profile, coupons,
              saved-looks
  Admin     : admin/dashboard, admin/insights, admin/orders, admin/customers,
              admin/admins, admin/coupons, settings/smtp, settings/cod,
              product CRUD, image upload, brands CRUD, testimonials CRUD,
              outfits CRUD, contact/admin, social-status

FEATURES (18 major)
  1. Product catalog with filters + search
  2. Product detail with virtual try-on (HF IDM-VTON)
  3. In-memory session cart (anon + authenticated)
  4. 3-step checkout (delivery → payment → confirm)
  5. Guest + authenticated order flow
  6. Email confirmation + admin notification
  7. Email/password auth + 5 OAuth providers
  8. VIP profile completion wizard
  9. Loyalty points (1 per 10 EGP)
  10. Birthday coupon auto-generation (yearly cron)
  11. 2-tier promo code system (global codes + user coupons)
  12. Wishlist
  13. Product reviews (star + text)
  14. Outfit "complete the look" system + saved looks
  15. Full admin back-office (14 management sections)
  16. 12-language i18n with RTL support
  17. Contact form with tracking references
  18. SMTP email (configurable via admin UI)
```

---

## 14. Feature Dependency Map & System Architecture Summary

### Feature Dependency Map

```
Authentication
├── Registration → users table, bcryptjs, JWT
├── Login → users table, bcryptjs, JWT
├── Social OAuth → Passport.js, users table (upsert), express-session
└── Auth context → localStorage (mu_token, mu_user)

Product Catalog
├── Listing → products table, categories table, reviews table (rating avg)
├── Detail → products table, reviews table, outfits table
└── Admin CRUD → products table, multer uploads, requireAdmin

Cart
├── Session cart → in-memory Map, JWT/cookie key
├── Cart drawer → CartContext (React)
└── Promo apply → promo validation endpoint → discount_codes / coupons

Checkout & Orders
├── Requires → Cart (items), Promo (discount), Delivery form
├── Creates → orders table, decrements products.stock
├── Triggers → loyalty points update (users.loyalty_points)
├── Triggers → confirmation email (nodemailer, settings.smtp_settings)
└── Guest path → optionalAuth, userId = null

Promo System
├── Global codes → discount_codes table
├── User coupons → coupons table
└── Birthday coupons → birthday.ts cron, users.birth_date, users.birthday_coupon_year

Loyalty & VIP
├── Points accrual → orders POST → users.loyalty_points
├── Profile completion → profile/complete → users (isPriority, isProfileComplete)
└── VIP email → mailer.ts, triggered on first profile complete

Admin Dashboard
├── KPIs → aggregate queries on orders, products, users
├── Revenue charts → GROUP BY date on orders
├── Order management → orders table CRUD
├── Product management → products table CRUD + image upload
├── Customer management → users table, priority toggle
└── Settings management → settings table (key-value JSON)

Content Management (Admin)
├── Brands → brands table
├── Testimonials → testimonials table
├── Outfits → outfits + outfit_items tables
├── Hero settings → settings table (hero_settings key)
├── Social links → settings table (social_media key)
└── Contact info → settings table (contact_settings key)

Virtual Try-On
├── Upload → multer (memory), temp file store, 15min TTL
├── Start → POST to HF Gradio API (IDM-VTON space)
└── Status → SSE stream from HF Gradio API

i18n
├── 12 locales in src/locales/*.json
├── Language stored in localStorage (mu_language)
├── RTL auto-applied for ar/fa/ur
└── Bilingual DB fields (name_ar, description_ar, etc.)
```

### System Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Users                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Replit Reverse Proxy (localhost:80)                  │
│   Path-based routing: /api → API Server, /* → Storefront         │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ /api                         │ /*
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  API Server (port 8080)   │    │  Storefront (port 20605)        │
│  Express 5 + TypeScript   │    │  React 19 + Vite                │
│                           │    │                                  │
│  Middleware:              │    │  - Wouter SPA router            │
│  ├── pino-http logging    │    │  - TanStack Query              │
│  ├── CORS (domain-aware)  │    │  - AuthProvider (JWT)          │
│  ├── Rate limiters        │    │  - CartProvider (in-memory)     │
│  ├── Security headers     │    │  - i18n (12 languages, RTL)     │
│  ├── express-session      │    │  - Framer Motion animations     │
│  └── Passport.js          │    │  - shadcn/ui components         │
│                           │◄───┤  (Generated API hooks)          │
│  Routes:                  │    └─────────────────────────────────┘
│  ├── /auth (rate limited)  │
│  ├── /products             │    ┌───────────────────────────────┐
│  ├── /cart (in-memory)    │    │  External Services            │
│  ├── /orders              │    │  ├── HF IDM-VTON (try-on)     │
│  ├── /admin (admin only)  │    │  ├── OAuth Providers          │
│  ├── /settings            │    │  │   (Google/Facebook/X/Apple) │
│  ├── /tryon               │───►│  └── SMTP (Gmail/configurable) │
│  └── /outfits             │    └───────────────────────────────┘
└──────────────┬────────────┘
               │ Drizzle ORM + pg
               ▼
┌──────────────────────────────────────────────────────────────────┐
│           PostgreSQL (Replit Managed Database)                    │
│  15 tables: users, products, categories, orders, reviews,         │
│  wishlist, discount_codes, coupons, settings, brands,             │
│  outfits, outfit_items, saved_looks, testimonials,               │
│  contact_messages                                                 │
└──────────────────────────────────────────────────────────────────┘

Code Generation Pipeline (run on schema changes):
  openapi.yaml → Orval → api-client-react (hooks) + api-zod (validators)
                          ↓                               ↓
                  Used in storefront              Used in API routes
```

### Data Flow: Complete Purchase Journey

```
1. User browses products
   → GET /api/products (no auth)
   → products + categories + reviews tables

2. User selects variant and adds to cart
   → POST /api/cart (JWT or cookie key)
   → In-memory Map on API server

3. User applies promo code
   → POST /api/promo/validate
   → discount_codes table (global) → coupons table (user-specific)

4. User fills delivery form and submits checkout
   → POST /api/orders (optionalAuth)
   → INSERT into orders table
   → UPDATE products.stock (GREATEST 0, non-blocking)
   → UPDATE users.loyalty_points (1 per 10 EGP, non-blocking)
   → sendMail: confirmation to customer + notification to admin

5. Admin updates order status
   → PUT /api/admin/orders/:id/status (requireAdmin)
   → UPDATE orders.status

6. User views order history
   → GET /api/orders (requireAuth)
   → SELECT from orders WHERE user_id = req.user.id
```
