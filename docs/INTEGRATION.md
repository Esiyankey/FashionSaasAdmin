# Storefront ↔ Admin integration

This app (Next.js 16 + Prisma 7 + PostgreSQL) is the **single source of truth** for the
Fashion SaaS storefront. Admins edit data here; the storefront reads it through the public
API under `/storefront/{orgSlug}`. The storefront's own organization is **`fashion-saas`**
(created by `npm run db:import-storefront`).

- [1. Contract conventions](#1-contract-conventions)
- [2. Public API reference](#2-public-api-reference)
- [3. Storefront service → endpoint mapping](#3-storefront-service--endpoint-mapping)
- [4. Freshness, caching and revalidation](#4-freshness-caching-and-revalidation)
- [5. Storefront connection](#5-storefront-connection)
- [6. Admin API (protected)](#6-admin-api-protected)
- [7. Environment and deployment](#7-environment-and-deployment)
- [8. Open business rules](#8-open-business-rules)

---

## 1. Contract conventions

| Topic | Rule |
| --- | --- |
| IDs | Every id is a string (database cuid). Products and blog posts are addressed by **slug** in URLs; `/products/{slugOrId}` also accepts the id. Numeric ids from the old mocks no longer exist. |
| Lists | Paginated lists always return `{ items, total, page, pageSize, totalPages }`. Non-paginated lists return `{ items }`. A bare array is never returned. |
| Pagination | `?page=1&pageSize=24`. Out-of-range values are clamped (max 100 for products, 50 for blog). |
| Errors | `{ message, code, fieldErrors? }`. `fieldErrors` keys are dotted paths, e.g. `shippingAddress.city`, `items.0.variantId`. |
| Status codes | 200/201 success · 204 no content · 400 malformed JSON · 401 not signed in (admin) · 403 wrong role · 404 not found **or not published** · 409 conflict (`OUT_OF_STOCK`, `INVALID_STATUS_TRANSITION`, `PRODUCT_HAS_ORDERS`, `CATEGORY_IN_USE`, `MEDIA_IN_USE`) · 422 validation (`VALIDATION_ERROR`) · 429 rate limited (`RATE_LIMITED`, `Retry-After` header). |
| Money | Numbers in the store currency (`currency` field / `commerce.currency`), rounded to 2 decimals by the server. |
| Images | Uploaded media is returned as an **absolute** URL (`https://admin-host/media/{id}`). Other URLs (https, Unsplash) are returned unchanged. |
| Visibility | Public endpoints only return published products, active categories, published blog posts with `publishedAt ≤ now`, active outfit options/looks and visible navigation/team. Internal fields (cost price, barcode, exact stock, notes) are never returned. |

## 2. Public API reference

Base: `{API_ORIGIN}/storefront/{orgSlug}`. No authentication. Browser calls need the
storefront origin in `STOREFRONT_ORIGINS` (CORS). GET responses carry
`Cache-Control: public, max-age=0, s-maxage=30, stale-while-revalidate=30`.

### Store, content, navigation

**`GET /`** — everything the layout and home page need.

```json
{
  "store": { "id": "…", "slug": "fashion-saas", "name": "Fashion SaaS", "description": "…", "logoUrl": null,
             "faviconUrl": null, "primaryColor": "#7a4b2a", "secondaryColor": "#f7f3ec", "fontFamily": "Inter",
             "siteUrl": "https://fashionsaas.example", "footerText": null,
             "seo": { "title": "Fashion SaaS", "description": "…" } },
  "contact": { "email": "hello@…", "phone": "(406) 555-0120", "addressLines": ["2331 Beverly Rd", "…"],
               "workingHours": "Mon - Sat: 9:00 - 5:00", "mapEmbedUrl": null },
  "socialLinks": [{ "platform": "instagram", "url": "https://…" }],
  "announcement": { "message": "Sign up and", "highlight": "get 25% off", "linkLabel": "Shop offers",
                    "linkHref": "/shop", "showPhone": true },          // null when switched off
  "hero": { "badgeText": "50% off…", "headline": "…", "subheadline": "…", "imageUrl": "https://…/media/…",
            "imageAlt": "…", "ctaLabel": "Shop Now", "ctaHref": "/shop" },  // null when no headline
  "navigation": { "header": [{ "label": "Shop", "href": "/shop" }], "footer": [ … ] },
  "commerce": { "currency": "USD", "taxRatePercent": 8, "shippingFlatRate": 0, "freeShippingThreshold": null },
  "updatedAt": "2026-10-05T…Z"
}
```

**`GET /pages/{key}`** — structured page content. Only `about` exists.

```json
{ "key": "about",
  "content": { "hero": { "eyebrow": "", "title": "", "image": { "url": "", "alt": "" } },
               "story": { "eyebrow": "", "heading": "", "body": "", "images": [{ "url": "", "alt": "" }], "ctaLabel": "", "ctaHref": "" },
               "quote": { "text": "", "author": "", "role": "" },            // may be null
               "inspiration": { "heading": "", "body": "", "image": { … }, "ctaLabel": "", "ctaHref": "" } },
  "teamMembers": [{ "id": "", "name": "", "role": "", "imageUrl": "" }],
  "updatedAt": "…" }
```

### Products

**`GET /products`**

| Param | Example | Notes |
| --- | --- | --- |
| `q` (alias `search`) | `linen` | Name, summary, description, type; exact SKU. |
| `category` | `women` or `women,men` or repeated | Slug, case-insensitive. Includes subcategories. Unknown slug → empty list. |
| `minPrice`, `maxPrice` | `0`, `450` | Matches the product price or any active variant price. **No default upper bound.** |
| `size`, `color` | `M`, `red,black` | Case-insensitive, active variants only. |
| `productType` | `dress` | |
| `featured` | `true` | Only featured, ordered by `featuredPosition`. |
| `inStock` | `true` | |
| `sort` | `featured` (default) · `newest` · `price-asc` · `price-desc` · `name-asc` | Invalid → 422. |
| `page`, `pageSize` | `1`, `24` | |

Response: `{ items: PublicProduct[], total, page, pageSize, totalPages }`.

```jsonc
// PublicProduct
{
  "id": "cmuv…", "slug": "floral-summer-dress", "name": "Floral Summer Dress",
  "summary": "…", "description": "…", "features": ["…"], "productType": "dress", "vendor": "Fashion SaaS",
  "category": { "id": "…", "slug": "women", "name": "Women", "parentId": null },   // primary (top-level first)
  "categories": [ … ],
  "price": 75, "compareAtPrice": 150, "discount": 50, "currency": "USD",          // discount is computed
  "image": "https://admin/media/…", "gallery": ["…"], "images": [{ "id": "", "url": "", "alt": "", "position": 0 }],
  "availableSizes": ["XS", "S", "M", "L"], "availableColors": ["Rose", "Ivory"],
  "variantOptionNames": ["Color", "Size"],
  "variants": [{ "id": "…", "title": "Rose / S", "sku": "FS-001-ROSE-S", "size": "S", "color": "Rose",
                 "options": [{ "name": "Color", "value": "Rose" }], "price": 75, "compareAtPrice": 150,
                 "discount": 50, "available": true, "imageId": null }],
  "inStock": true, "isFeatured": true,
  "rating": null,                       // no review system yet
  "seo": { "title": "…", "description": "…" },
  "publishedAt": "…", "updatedAt": "…"
}
```

**`GET /products/{slugOrId}`** → `PublicProduct` (404 if draft/archived/missing).
**`GET /products/{slugOrId}/related?limit=4`** → `{ items: PublicProduct[] }` (same category, published).
**`GET /product-filters`** → `{ priceRange: { min, max }, sizes: [], colors: [], productTypes: [] }` — use for the price slider instead of the hard-coded 300.

### Categories

**`GET /categories`** → `{ items: PublicCategory[] }`, active only, in display order.
**`GET /categories/{slug}`** → `PublicCategory`.

```json
{ "id": "…", "slug": "women", "name": "Women", "title": "For Women's", "description": "",
  "imageUrl": "https://…", "imageAlt": "…", "parentId": null, "position": 0,
  "productCount": 4,                     // published products incl. subcategories — never stored
  "children": [{ "id": "…", "slug": "women-dresses", "name": "Dresses", "productCount": 0 }] }
```

### Blog

**`GET /blog?page=&pageSize=&category=&featured=`** → paginated posts **without** `content`.
**`GET /blog/{slug}`** → post with `content` (Markdown).
**`GET /blog-categories`** → `{ items: [{ id, slug, name, postCount }] }`.

```json
{ "id": "…", "slug": "gots-sustainability-explained", "title": "…", "excerpt": "…", "content": "…markdown…",
  "coverImageUrl": "https://…", "coverImageAlt": "…", "authorName": null,
  "category": { "id": "…", "slug": "gold-style", "name": "Gold Style" }, "isFeatured": false,
  "publishedAt": "2023-10-24T12:00:00.000Z", "seo": { "title": "…", "description": "…" } }
```

### Forms

**`POST /contact`** `{ name, email, subject, message, phone?, website? }` → `201 { id, message }`.
`website` is a honeypot (keep it hidden and empty). 5 requests / 10 min / IP.

**`POST /newsletter`** `{ email, source? }` → `201 { status: "subscribed", message }` or
`200 { status: "already_subscribed" | "resubscribed", message }`. Emails are lower-cased. 10 / 10 min / IP.

### Outfit Finder

**`GET /outfit-finder`** → `{ bodyTypes: [{ key, label, imageUrl }], skinTones: [{ key, label, hex }], occasions: [{ key, label, imageUrl }] }`
**`POST /outfit-finder/recommendations`** `{ bodyType, skinTone, occasion }` (option keys) →

```json
{ "lookId": "…", "styleName": "The Amber Gala Set", "description": "…", "tags": ["Limited Edition"],
  "occasion": { "key": "grand-wedding", "label": "Grand Wedding" },
  "recommendedProducts": [PublicProduct], "completeTheLook": [PublicProduct] }
```

422 for unknown keys; 404 `No look is configured for this occasion yet`.

### Checkout and guest orders (no payment is collected)

**`POST /checkout`**

```json
{
  "shippingAddress": { "fullName": "", "email": "", "phone": "", "street": "", "apartment": "",
                       "city": "", "state": "", "zipCode": "", "country": "" },
  "items": [{ "productId": "…", "variantId": "…", "quantity": 1 }],
  "paymentMethod": "cod",
  "note": "optional"
}
```

- Each item needs `variantId`, **or** `size`/`color` (matched case-insensitively) when the product has variants.
- The body must not contain prices, discounts or totals. Unknown fields → **422**.
- The server prices every line from the database, applies tax/shipping from settings, and
  reserves stock in one transaction. Not enough stock → **409 `OUT_OF_STOCK`**; unavailable
  product/variant → **422** with `fieldErrors["items.N…"]` (refresh the cart).
- `201` returns the order (`orderNumber`, `status: "pending"`, `items`, `subtotal`, `shipping`,
  `tax`, `total`, `currency`, …) plus **`accessToken`** — store it to show the order later.
- 20 requests / 10 min / IP.

**`GET /orders/{orderNumber}?token=…`** (or header `X-Order-Token`) → the order. Wrong token → 404.
**`POST /orders/{orderNumber}/cancel?token=…`** → cancels while `pending` (stock is returned); otherwise 409.

### Media

**`GET /media/{id}`** → image bytes, `Cache-Control: public, max-age=31536000, immutable`.

## 3. Storefront service → endpoint mapping

| Storefront code (FashionSaas repo) | Today | Endpoint | Change needed |
| --- | --- | --- | --- |
| `product.service.getProducts(filters)` | mock + client filter | `GET /products?category=&minPrice=&maxPrice=&sort=` | Map `categories` → `category` slugs; drop `filterProducts`/`sortProducts`; sort `rating` → not supported (no reviews). |
| `product.service.getProductById(id: number)` | mock | `GET /products/{slug}` | Route `/products/[id]` → `/products/[slug]`; `Product.id` becomes string. |
| `product.service.getRelatedProducts` | mock | `GET /products/{slug}/related` | |
| `product.service.getFeaturedProducts` | `slice(0, 8)` | `GET /products?featured=true&pageSize=8` | |
| `PRODUCT_CATEGORIES` constant / `ProductCategory` union | hard-coded | `GET /categories` | Build filters from data. |
| `ShopCatalog` price bounds `[0, 300]` | hard-coded | `GET /product-filters` | Fixes products > $300 being hidden. |
| `category.service.getCategories` | mock | `GET /categories` | `itemCount` → `productCount`; `subCategories` → `children`; card links `/shop?category={slug}`. |
| `order.service.createOrder` | in-memory array | `POST /checkout` | Send `{ shippingAddress, items: [{ productId, variantId, quantity }], paymentMethod }` only. |
| `order.service.getOrderById` / `cancelOrder` | in-memory | `GET /orders/{n}?token=` / `POST /orders/{n}/cancel?token=` | Persist `orderNumber` + `accessToken` (e.g. localStorage) after checkout. |
| `order.service.getOrders(customerId)` | in-memory | — | Not available: there are no customer accounts. |
| `recommendation.service.getOutfitRecommendation` | mock + 600 ms delay | `POST /outfit-finder/recommendations` | |
| `OutfitFinder.tsx` option arrays | inline | `GET /outfit-finder` | |
| `app/lib/blog-data.ts` + inline array in `blog/page.tsx` | two datasets | `GET /blog`, `GET /blog/{slug}` | Delete both datasets; "Read More" links by slug; render `content` as Markdown. |
| Contact form | `console.log` | `POST /contact` | Show success only on 201, field errors on 422. |
| Blog newsletter form | does nothing | `POST /newsletter` | |
| `siteConfig` contact/nav, Navbar announcement, `HeroBanner`, About page, Footer | hard-coded | `GET /`, `GET /pages/about` | |
| `CartProvider` `TAX_RATE`/`SHIPPING_COST`, `formatCurrency('USD')` | hard-coded | `GET /` → `commerce` | Show as an estimate; the order total comes from the server. |
| `useBusinessContextStore` | mock business | `GET /` → `store` | |
| `auth.service`, `customer.service` | unused | — | Not implemented: no customer accounts in scope (guest checkout). |
| `sitemap.ts` | mocks | `GET /products?pageSize=100` (paged), `GET /blog?pageSize=50` | Use `updatedAt` / `publishedAt` for `lastModified`. |

## 4. Freshness, caching and revalidation

**What the storefront does today:** Next.js 16 *without* `cacheComponents`. `/products/[id]`
and `/blog/[slug]` use `generateStaticParams`, so they are prerendered at build time; the sitemap
and home are built from data at build time; client components use TanStack Query with
`staleTime: 30s`. Without a change, a prerendered page would only update on redeploy.

**Agreed window: changes are live within 60 seconds, usually immediately.** Two independent
layers make this work without a redeploy:

1. **Time-based (always on).** Storefront server fetches use `next: { revalidate: 60, tags }`
   (see §5). Every public GET also sends `s-maxage=30, stale-while-revalidate=30`, so a CDN in
   front of the API never serves anything older than ~60 s. TanStack Query refetches after 30 s.
2. **On-demand (when configured).** After every admin write that affects public data, this app
   POSTs to `STOREFRONT_REVALIDATE_URL`:

   ```http
   POST /api/revalidate
   Authorization: Bearer <STOREFRONT_REVALIDATE_SECRET>
   Content-Type: application/json

   { "organizationSlug": "fashion-saas", "tags": ["products", "product:floral-summer-dress", "categories"] }
   ```

   Tags: `products`, `product:{slug}`, `categories`, `content`, `settings`, `blog`, `blog:{slug}`,
   `outfit-finder`. The call runs after the admin response is sent (`after()`), times out after
   5 s and never fails the admin action; failures are logged as `[revalidate] …`.

Unpublished products and posts return **404 from the API immediately**; once the storefront
revalidates (≤ 60 s, or instantly via the webhook) its pages call `notFound()`.

## 5. Storefront connection

The sibling `FashionSaas` repository now reads the admin API for products, categories, store
branding, navigation, About content, blog posts, contact/newsletter submissions, checkout,
orders, and Outfit Finder recommendations. It uses `/storefront/{NEXT_PUBLIC_STORE_SLUG}` as
its API base. See that repository's `.env.example` and README for local and production setup.

The storefront `.env.example` documents the exact variables. It includes a dev-only fallback for
the local API; production requires explicit values. Server-rendered GET requests use tagged
revalidation, while browser requests are uncached. The signed revalidation endpoint accepts only
known tag names. Uploaded admin media is served from `/media/{id}` and the storefront allows the
configured API host in `images.remotePatterns`.

Checkout sends product and variant IDs, quantities, shipping address, and `cod`; the server
recomputes prices, tax, and shipping and reserves inventory in a transaction. Guest order access
tokens are retained in the shopper's browser for lookup and pending-only cancellation. No card
data is collected because no payment provider is configured.
## 6. Admin API (protected)

Session cookie (`/admin/auth/login`); every route checks the role server-side and scopes data
to the admin's organization. Anonymous → 401, wrong role → 403, another org's record → 404.

| Resource | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| Products | GET, POST | `/admin/products` | List (search incl. variant SKU, status, category, sort, pagination) / create |
| | GET, PATCH, DELETE | `/admin/products/{id}` | Detail / update (variant ids preserved) / delete (409 if ordered) |
| | POST | `/admin/products/bulk-publish` · `bulk-unpublish` · `bulk-archive` · `bulk-delete` | Status changes `{ ids }` |
| | POST | `/admin/products/{id}/duplicate` | Copy as draft (without SKUs) |
| | GET | `/admin/products/stats` | Counts |
| Inventory | GET | `/admin/inventory` | Stock list |
| | POST | `/admin/inventory/{productId}/adjust` | `{ variantId?, delta }` |
| Categories | GET, POST | `/admin/categories` | List with product counts / create |
| | PATCH, DELETE | `/admin/categories/{id}` | Update / archive (409 while in use) |
| Orders | GET | `/admin/orders` | Search (number, name, email, phone), status, payment, `from`/`to` |
| | GET, PATCH | `/admin/orders/{id}` | Detail with history / `{ status, note, trackingNumber, carrier, cancelReason, paymentStatus, internalNotes }` |
| Customers | GET | `/admin/customers`, `/admin/customers/{id}` | |
| Store content | GET, PATCH | `/admin/storefront-config` | Store info, contact, social, branding, announcement, hero |
| | GET, PUT | `/admin/navigation` | Replace header/footer menus |
| | GET, PUT | `/admin/pages/about` | Structured About page |
| | GET, POST · PATCH, DELETE | `/admin/team-members` · `/{id}` | |
| Settings | GET, PATCH | `/admin/settings` | Currency, tax, shipping, order prefix |
| Blog | GET, POST · GET, PATCH, DELETE | `/admin/blog-posts` · `/{id}` | Publish/unpublish/archive via `status`; delete drafts only |
| | GET, POST · PATCH, DELETE | `/admin/blog-categories` · `/{id}` | |
| Inbox | GET · GET, PATCH, DELETE | `/admin/contact-messages` · `/{id}` | Opening marks read |
| Newsletter | GET · PATCH, DELETE | `/admin/newsletter-subscribers` · `/{id}` | |
| | GET | `/admin/newsletter-subscribers/export` | CSV |
| Outfit Finder | GET, POST · PATCH, DELETE | `/admin/outfit-finder/options` · `/{id}` | |
| | GET, POST · GET, PATCH, DELETE | `/admin/outfit-finder/looks` · `/{id}` | |
| Media | GET, POST · DELETE | `/admin/media` · `/{id}` | Upload (multipart `file`, ≤ 5 MB, JPG/PNG/WEBP/GIF/AVIF verified by content) / delete (409 while used) |

## 7. Environment and deployment

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | admin | yes | PostgreSQL connection string |
| `AUTH_SECRET` | admin | yes | Signs the admin session cookie |
| `STOREFRONT_ORIGINS` | admin | for browser calls | CORS allow-list for the storefront origin(s) |
| `STOREFRONT_REVALIDATE_URL` / `STOREFRONT_REVALIDATE_SECRET` | admin | recommended | On-demand revalidation webhook |
| `PUBLIC_ASSET_BASE_URL` | admin | behind a proxy | Public origin for absolute `/media` URLs |
| `NEXT_PUBLIC_API_BASE_URL` | admin | no | Only if the admin UI is served from a different origin than its API (normally empty) |
| `NEXT_PUBLIC_API_BASE_URL` | storefront | yes | Admin API origin, without a trailing slash |
| `NEXT_PUBLIC_STORE_SLUG` | storefront | yes | Organization slug, normally `fashion-saas` |
| `NEXT_PUBLIC_SITE_URL` | storefront | recommended | Canonical origin for sitemap, robots, metadata and checkout links |
| `REVALIDATE_SECRET` | storefront server | yes for webhook | Same secret as admin `STOREFRONT_REVALIDATE_SECRET` |

Deployment order:

1. **Database:** provision Postgres; set `DATABASE_URL`. Back up before migrating.
2. **Migrations:** `npm run db:deploy` (= `prisma migrate deploy`). Never `migrate reset`/`dev` against production.
3. **Data:** first time only, `npm run db:import-storefront` with `IMPORT_ADMIN_EMAIL`,
   `IMPORT_ADMIN_PASSWORD` and `IMPORT_STOREFRONT_PUBLIC_DIR` (path to the storefront's `public/`).
4. **Admin/API:** `npm run build && npm start` (build runs `prisma generate`). Set the variables above.
5. **Media:** stored in Postgres and served by this app at `/media/{id}` — no bucket needed. Put
   a CDN in front (responses are immutable). Move to object storage if volume grows.
6. **CORS:** set `STOREFRONT_ORIGINS` to the storefront's exact origin(s).
7. **Storefront:** set the documented variables, add the admin host to `images.remotePatterns`, deploy.
8. **Verify:** `E2E_BASE_URL=… E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e`
   (creates and cleans up `E2E`-prefixed records).

Rate limiting is per server instance (in memory). With several instances, use the platform's
firewall/rate limiting or a shared store.

## 8. Open business rules

Implemented with a sensible default; confirm or change:

| Rule | Current behaviour |
| --- | --- |
| Outfit look matching | Active looks for the occasion; a look qualifies if its body-type and skin-tone lists are empty or contain the choice; most specific wins, then lowest position. The imported looks are the old mock (same products for every occasion) — curate them. |
| Cancel restocks inventory | Yes, for admin and customer cancellations. |
| Customer self-cancel | Only while `pending`. |
| Card/wallet payment methods | Accepted and recorded, but no payment is taken; `paymentStatus` stays `PENDING` until set manually. Consider allowing only `cod` until a provider exists. |
| Publishing requirements | Product: price > 0 and ≥ 1 image. Post: excerpt, content and cover image. |
| Tracking number on ship | Optional. |
| Deleting categories | Refused while products/subcategories use them; hide (deactivate) instead. |
| Imported placeholder data | Stock (10 per variant), SKUs (`FS-…`), contact details (`*.example`), blog bodies (excerpt + the old shared boilerplate), category descriptions (lorem ipsum removed). Review in the admin. |
| Product rating / reviews | Not built; `rating` is `null`. |
| Customer accounts, wishlist | Not built (guest checkout only). |
