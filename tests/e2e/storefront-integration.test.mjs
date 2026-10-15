/**
 * End-to-end integration tests: admin API → database → public storefront API.
 *
 * Runs against a live server (no mocks):
 *
 *   E2E_BASE_URL=http://localhost:3000 \
 *   E2E_ORG_SLUG=fashion-saas \
 *   E2E_ADMIN_EMAIL=admin@fashionsaas.example E2E_ADMIN_PASSWORD=... \
 *   node --test tests/e2e/
 *
 * Optional:
 *   E2E_OTHER_ADMIN_EMAIL / E2E_OTHER_ADMIN_PASSWORD  admin of a different org (tenant isolation)
 *   E2E_WEBHOOK_LOG       file a stand-in storefront revalidation endpoint appends to
 *   E2E_ALLOWED_ORIGIN    an origin listed in STOREFRONT_ORIGINS (CORS)
 *
 * Test records are prefixed "E2E" and cleaned up where the business rules allow
 * (products that received orders can only be archived, never deleted).
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ORG = process.env.E2E_ORG_SLUG ?? "fashion-saas";
const RUN = Date.now().toString(36);
const PUBLIC = `${BASE}/storefront/${ORG}`;

// 1×1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

let cookie = "";
const state = {};

async function login(email, password) {
  const response = await fetch(`${BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `login failed for ${email}`);
  return response.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function call(method, path, body, { auth = cookie, headers = {} } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(path.startsWith("http") ? path : `${BASE}${path}`, {
    method,
    headers: { ...(auth ? { Cookie: auth } : {}), ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, body: json, headers: response.headers };
}

const admin = (method, path, body) => call(method, path, body);
const pub = (method, path, body, headers) => call(method, `${PUBLIC}${path}`, body, { auth: "", headers });

function productInput(overrides = {}) {
  return {
    title: `E2E Linen Shirt ${RUN}`,
    description: "Integration test product.",
    summary: "A test shirt.",
    features: ["Breathable"],
    vendor: "E2E",
    productType: "shirt",
    status: "draft",
    price: 40,
    compareAtPrice: 50,
    costPerItem: 12,
    sku: `E2E-${RUN}`,
    barcode: "000111222",
    inventory: { trackQuantity: true, quantity: 0, lowStockThreshold: 2, allowBackorder: false },
    images: [{ id: "new-1", url: state.imageUrl, alt: "E2E shirt", position: 0 }],
    categoryIds: [state.categoryId],
    variantOptionNames: ["Size", "Color"],
    variants: [
      { id: "new-a", title: "S / Red", options: [{ name: "Size", value: "S" }, { name: "Color", value: "Red" }], sku: `E2E-${RUN}-S`, inventoryQuantity: 5 },
      { id: "new-b", title: "M / Red", options: [{ name: "Size", value: "M" }, { name: "Color", value: "Red" }], sku: `E2E-${RUN}-M`, inventoryQuantity: 1 },
    ],
    seo: { title: "", description: "" },
    shipping: { requiresShipping: true },
    isFeatured: false,
    ...overrides,
  };
}

/** Product form payload rebuilt from the admin representation (as the edit page does). */
function toForm(product, overrides = {}) {
  return {
    ...productInput(),
    title: product.title,
    status: product.status,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images,
    variants: product.variants,
    categoryIds: product.categoryIds,
    ...overrides,
  };
}

const address = {
  fullName: "E2E Shopper",
  email: `e2e-shopper-${RUN}@example.com`,
  phone: "+1 555 0100",
  street: "1 Test Street",
  city: "Testville",
  state: "TS",
  zipCode: "12345",
};

before(async () => {
  assert.ok(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
  cookie = await login(process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD);
});

after(async () => {
  if (state.blogPostId) await admin("DELETE", `/admin/blog-posts/${state.blogPostId}`);
  if (state.messageId) await admin("DELETE", `/admin/contact-messages/${state.messageId}`);
  if (state.subscriberId) await admin("DELETE", `/admin/newsletter-subscribers/${state.subscriberId}`);
  if (state.productId) await admin("POST", "/admin/products/bulk-archive", { ids: [state.productId] });
  if (state.configBefore) await admin("PATCH", "/admin/storefront-config", state.configBefore);
});

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

test("admin endpoints reject anonymous callers", async () => {
  for (const [method, path, body] of [
    ["GET", "/admin/products"],
    ["POST", "/admin/products", {}],
    ["GET", "/admin/orders"],
    ["GET", "/admin/contact-messages"],
    ["GET", "/admin/newsletter-subscribers"],
    ["PATCH", "/admin/storefront-config", { storeName: "x" }],
    ["POST", "/admin/blog-posts", { title: "x" }],
  ]) {
    const response = await call(method, path, body, { auth: "" });
    assert.equal(response.status, 401, `${method} ${path} should be 401`);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});

test("public storefront endpoints work without authentication", async () => {
  for (const path of ["", "/products", "/categories", "/blog", "/outfit-finder", "/product-filters", "/pages/about"]) {
    const response = await pub("GET", path);
    // About content is optional until an admin publishes the page.
    assert.ok(path === "/pages/about" ? [200, 404].includes(response.status) : response.status === 200, `GET ${path}: ${JSON.stringify(response.body)}`);
  }
});

test("CORS: allowed storefront origin gets headers, others do not", { skip: !process.env.E2E_ALLOWED_ORIGIN }, async () => {
  const allowed = await fetch(`${PUBLIC}/products`, { headers: { Origin: process.env.E2E_ALLOWED_ORIGIN } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), process.env.E2E_ALLOWED_ORIGIN);
  const other = await fetch(`${PUBLIC}/products`, { headers: { Origin: "https://evil.example" } });
  assert.equal(other.headers.get("access-control-allow-origin"), null);
  const preflight = await fetch(`${PUBLIC}/checkout`, {
    method: "OPTIONS",
    headers: { Origin: process.env.E2E_ALLOWED_ORIGIN, "Access-Control-Request-Method": "POST" },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-credentials"), null, "cookies must never be allowed cross-origin");
});

// ---------------------------------------------------------------------------
// Media + categories + products
// ---------------------------------------------------------------------------

test("media upload validates type and returns a durable URL", async () => {
  const bad = new FormData();
  bad.append("file", new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "evil.png");
  const rejected = await admin("POST", "/admin/media", bad);
  assert.equal(rejected.status, 422, "content that is not an image is rejected even with an image MIME type");

  const form = new FormData();
  form.append("file", new Blob([PNG], { type: "image/png" }), "e2e.png");
  const uploaded = await admin("POST", "/admin/media", form);
  assert.equal(uploaded.status, 201);
  assert.match(uploaded.body.url, /^\/media\/\w+$/);
  state.imageUrl = uploaded.body.url;
  state.mediaId = uploaded.body.id;

  const served = await fetch(`${BASE}${uploaded.body.url}`);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");
});

test("category: create with case-insensitive unique name, visible publicly", async () => {
  const name = `E2E Linen ${RUN}`;
  const created = await admin("POST", "/admin/categories", { name, title: "Linen edit", imageUrl: state.imageUrl, position: 99 });
  assert.equal(created.status, 201);
  state.categoryId = created.body.id;
  state.categorySlug = created.body.slug;
  assert.equal(created.body.slug, name.toLowerCase().replace(/\s+/g, "-"));

  const duplicate = await admin("POST", "/admin/categories", { name: name.toUpperCase() });
  assert.equal(duplicate.status, 422, "same name in different case is rejected");

  const publicList = await pub("GET", "/categories");
  const category = publicList.body.items.find((entry) => entry.slug === state.categorySlug);
  assert.ok(category, "new category is public");
  assert.equal(category.productCount, 0);
  assert.equal(category.imageUrl, `${BASE}${state.imageUrl}`, "media URL is absolute for the storefront");
});

test("product validation: blob URLs, compare-at price, publish without image", async () => {
  const blob = await admin("POST", "/admin/products", productInput({ images: [{ id: "x", url: "blob:http://localhost/abc", position: 0 }] }));
  assert.equal(blob.status, 422);
  const compare = await admin("POST", "/admin/products", productInput({ compareAtPrice: 30 }));
  assert.equal(compare.status, 422);
  assert.ok(compare.body.fieldErrors.compareAtPrice);
  const noImage = await admin("POST", "/admin/products", productInput({ status: "published", images: [] }));
  assert.equal(noImage.status, 422);
  const dupVariant = await admin(
    "POST",
    "/admin/products",
    productInput({ variants: [productInput().variants[0], { ...productInput().variants[0], id: "dup", sku: "OTHER" }] })
  );
  assert.equal(dupVariant.status, 422, "duplicate size/colour combination is rejected");
});

test("product: draft is hidden, publish exposes it, public payload hides internal fields", async () => {
  const created = await admin("POST", "/admin/products", productInput());
  assert.equal(created.status, 201, JSON.stringify(created.body));
  state.productId = created.body.id;
  state.productSlug = created.body.slug;
  state.variantIds = created.body.variants.map((variant) => variant.id);

  assert.equal((await pub("GET", `/products/${state.productSlug}`)).status, 404, "draft is not public");

  const publish = await admin("POST", "/admin/products/bulk-publish", { ids: [state.productId] });
  assert.equal(publish.status, 204);

  const bySlug = await pub("GET", `/products/${state.productSlug}`);
  assert.equal(bySlug.status, 200);
  const product = bySlug.body;
  assert.equal(product.name, `E2E Linen Shirt ${RUN}`);
  assert.equal(product.price, 40);
  assert.equal(product.compareAtPrice, 50);
  assert.equal(product.discount, 20);
  assert.equal(product.category.slug, state.categorySlug);
  assert.deepEqual(product.availableSizes, ["S", "M"]);
  assert.deepEqual(product.availableColors, ["Red"]);
  assert.equal(product.variants.length, 2);
  assert.ok(product.variants.every((variant) => variant.available === true));
  assert.equal(product.image, `${BASE}${state.imageUrl}`);
  assert.equal(product.inStock, true);
  for (const field of ["costPerItem", "barcode", "inventory", "status"]) {
    assert.equal(field in product, false, `public product must not expose ${field}`);
  }
  assert.equal("inventoryQuantity" in product.variants[0], false, "exact stock is not public");

  const byId = await pub("GET", `/products/${state.productId}`);
  assert.equal(byId.status, 200, "lookup by id also works");
});

test("product list filters: category, price, size, colour, search, sort", async () => {
  const has = async (query) => {
    const response = await pub("GET", `/products?pageSize=100&${query}`);
    assert.equal(response.status, 200, query);
    assert.ok("totalPages" in response.body && "page" in response.body, "consistent pagination envelope");
    return response.body.items.some((item) => item.id === state.productId);
  };
  assert.equal(await has(`category=${state.categorySlug.toUpperCase()}`), true, "category slug is case-insensitive");
  assert.equal(await has(`category=${state.categorySlug}&minPrice=10&maxPrice=45`), true);
  assert.equal(await has(`category=${state.categorySlug}&minPrice=41`), false);
  assert.equal(await has(`category=${state.categorySlug}&size=m`), true);
  assert.equal(await has(`category=${state.categorySlug}&size=XL`), false);
  assert.equal(await has(`category=${state.categorySlug}&color=red`), true);
  assert.equal(await has(`q=${encodeURIComponent(`Linen Shirt ${RUN}`)}`), true);
  assert.equal(await has(`q=E2E-${RUN}-S`), true, "search by variant SKU");

  const sorted = await pub("GET", "/products?sort=price-asc&pageSize=100");
  const prices = sorted.body.items.map((item) => item.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

  const invalid = await pub("GET", "/products?sort=bogus");
  assert.equal(invalid.status, 422);
});

test("category product count is derived from published products", async () => {
  const list = await pub("GET", "/categories");
  assert.equal(list.body.items.find((entry) => entry.slug === state.categorySlug).productCount, 1);
});

test("product update keeps variant ids and is reflected publicly", async () => {
  const current = (await admin("GET", `/admin/products/${state.productId}`)).body;
  const updated = await admin("PATCH", `/admin/products/${state.productId}`, toForm(current, { price: 42 }));
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.deepEqual(updated.body.variants.map((variant) => variant.id).sort(), [...state.variantIds].sort());
  assert.equal((await pub("GET", `/products/${state.productSlug}`)).body.price, 42);
});

test("unpublish and archive remove the product from every public endpoint", async () => {
  await admin("POST", "/admin/products/bulk-unpublish", { ids: [state.productId] });
  assert.equal((await pub("GET", `/products/${state.productSlug}`)).status, 404);
  const list = await pub("GET", `/products?category=${state.categorySlug}`);
  assert.equal(list.body.total, 0);
  assert.equal((await pub("GET", "/categories")).body.items.find((entry) => entry.slug === state.categorySlug).productCount, 0);

  await admin("POST", "/admin/products/bulk-archive", { ids: [state.productId] });
  assert.equal((await pub("GET", `/products/${state.productSlug}`)).status, 404);

  await admin("POST", "/admin/products/bulk-publish", { ids: [state.productId] });
  assert.equal((await pub("GET", `/products/${state.productSlug}`)).status, 200);
});

test("revalidation webhook is sent to the storefront after admin changes", { skip: !process.env.E2E_WEBHOOK_LOG }, async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert.ok(existsSync(process.env.E2E_WEBHOOK_LOG));
  const calls = readFileSync(process.env.E2E_WEBHOOK_LOG, "utf-8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const forProduct = calls.filter((entry) => entry.body.tags?.includes(`product:${state.productSlug}`));
  assert.ok(forProduct.length >= 3, "create, publish, update, unpublish each notify the storefront");
  assert.ok(forProduct.every((entry) => entry.auth?.startsWith("Bearer ")), "webhook is authenticated");
  assert.ok(forProduct.every((entry) => entry.body.organizationSlug === ORG));
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

test("checkout rejects tampering and invalid input", async () => {
  const item = { productId: state.productId, variantId: state.variantIds[0], quantity: 1 };
  const withPrice = await pub("POST", "/checkout", { shippingAddress: address, items: [{ ...item, price: 0.01 }] });
  assert.equal(withPrice.status, 422, "client-supplied price is rejected");
  const withTotal = await pub("POST", "/checkout", { shippingAddress: address, items: [item], total: 1 });
  assert.equal(withTotal.status, 422, "client-supplied total is rejected");
  const zeroQty = await pub("POST", "/checkout", { shippingAddress: address, items: [{ ...item, quantity: 0 }] });
  assert.equal(zeroQty.status, 422);
  const missingAddress = await pub("POST", "/checkout", { shippingAddress: { ...address, city: "" }, items: [item] });
  assert.equal(missingAddress.status, 422);
  assert.ok(missingAddress.body.fieldErrors["shippingAddress.city"]);
  const unknownProduct = await pub("POST", "/checkout", { shippingAddress: address, items: [{ productId: "does-not-exist", quantity: 1 }] });
  assert.equal(unknownProduct.status, 422);
  const noVariant = await pub("POST", "/checkout", { shippingAddress: address, items: [{ productId: state.productId, quantity: 1 }] });
  assert.equal(noVariant.status, 422, "a variant must be chosen when the product has variants");
  const tooMany = await pub("POST", "/checkout", { shippingAddress: address, items: [{ ...item, variantId: state.variantIds[1], quantity: 2 }] });
  assert.equal(tooMany.status, 409);
  assert.equal(tooMany.body.code, "OUT_OF_STOCK");
});

test("checkout prices the order on the server and reserves stock", async () => {
  const settings = (await admin("GET", "/admin/settings")).body;
  const response = await pub("POST", "/checkout", {
    shippingAddress: address,
    // Size/colour lookup is supported as an alternative to variantId.
    items: [{ productId: state.productId, size: "s", color: "RED", quantity: 2 }],
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const order = response.body;
  const subtotal = 84;
  const shipping = settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFlatRate;
  const tax = Math.round(subtotal * (settings.taxRatePercent / 100) * 100) / 100;
  assert.equal(order.subtotal, subtotal);
  assert.equal(order.shipping, shipping);
  assert.equal(order.tax, tax);
  assert.equal(order.total, Math.round((subtotal + shipping + tax) * 100) / 100);
  assert.equal(order.status, "pending");
  assert.equal(order.items[0].unitPrice, 42);
  assert.equal(order.items[0].sku, `E2E-${RUN}-S`);
  assert.ok(order.accessToken);
  state.order = order;

  const product = (await admin("GET", `/admin/products/${state.productId}`)).body;
  assert.equal(product.variants.find((variant) => variant.sku === `E2E-${RUN}-S`).inventoryQuantity, 3, "5 - 2 = 3 left");
});

test("guest order lookup requires the access token", async () => {
  const { orderNumber, accessToken } = state.order;
  assert.equal((await pub("GET", `/orders/${orderNumber}?token=${accessToken}`)).status, 200);
  assert.equal((await pub("GET", `/orders/${orderNumber}?token=wrong`)).status, 404);
  assert.equal((await pub("GET", `/orders/${orderNumber}`)).status, 404);
  const viaHeader = await pub("GET", `/orders/${orderNumber}`, undefined, { "X-Order-Token": accessToken });
  assert.equal(viaHeader.status, 200);
  assert.equal("internalNotes" in viaHeader.body, false);
});

test("admin sees the order, enforces the status workflow and records history", async () => {
  const list = await admin("GET", `/admin/orders?search=${state.order.orderNumber}`);
  assert.equal(list.body.total, 1);
  const id = list.body.items[0].id;
  assert.equal(list.body.items[0].shippingAddress.address.city, "Testville");

  const skip = await admin("PATCH", `/admin/orders/${id}`, { status: "DELIVERED" });
  assert.equal(skip.status, 409);
  assert.equal(skip.body.code, "INVALID_STATUS_TRANSITION");

  assert.equal((await admin("PATCH", `/admin/orders/${id}`, { status: "PROCESSING", note: "Packing" })).status, 200);
  const shipped = await admin("PATCH", `/admin/orders/${id}`, { status: "SHIPPED", trackingNumber: "TRACK123", carrier: "DHL" });
  assert.equal(shipped.status, 200);
  assert.equal(shipped.body.trackingNumber, "TRACK123");
  assert.ok(shipped.body.shippedAt);
  assert.deepEqual(
    shipped.body.statusHistory.map((entry) => entry.toStatus),
    ["PENDING", "PROCESSING", "SHIPPED"]
  );
  assert.ok(shipped.body.statusHistory[2].changedBy, "history records who made the change");

  const cancelShipped = await admin("PATCH", `/admin/orders/${id}`, { status: "CANCELLED", cancelReason: "x" });
  assert.equal(cancelShipped.status, 409, "shipped orders cannot be cancelled");

  const forgedTotal = await admin("PATCH", `/admin/orders/${id}`, { total: 1 });
  assert.equal(forgedTotal.status, 422, "totals are immutable");

  const publicView = await pub("GET", `/orders/${state.order.orderNumber}?token=${state.order.accessToken}`);
  assert.equal(publicView.body.status, "shipped");
});

test("cancelling returns stock; customers can self-cancel only while pending", async () => {
  const placed = await pub("POST", "/checkout", {
    shippingAddress: address,
    items: [{ productId: state.productId, variantId: state.variantIds[0], quantity: 1 }],
  });
  assert.equal(placed.status, 201);
  const stockAfterOrder = (await admin("GET", `/admin/products/${state.productId}`)).body.variants.find((v) => v.id === state.variantIds[0]).inventoryQuantity;

  const cancel = await pub("POST", `/orders/${placed.body.orderNumber}/cancel?token=${placed.body.accessToken}`);
  assert.equal(cancel.status, 200, JSON.stringify(cancel.body));
  assert.equal(cancel.body.status, "cancelled");
  const stockAfterCancel = (await admin("GET", `/admin/products/${state.productId}`)).body.variants.find((v) => v.id === state.variantIds[0]).inventoryQuantity;
  assert.equal(stockAfterCancel, stockAfterOrder + 1);

  const again = await pub("POST", `/orders/${placed.body.orderNumber}/cancel?token=${placed.body.accessToken}`);
  assert.equal(again.status, 409);
});

test("products with orders cannot be hard-deleted", async () => {
  const response = await admin("DELETE", `/admin/products/${state.productId}`);
  assert.equal(response.status, 409);
  assert.equal(response.body.code, "PRODUCT_HAS_ORDERS");
});

test("media still in use cannot be deleted", async () => {
  const response = await admin("DELETE", `/admin/media/${state.mediaId}`);
  assert.equal(response.status, 409);
  assert.equal(response.body.code, "MEDIA_IN_USE");
});

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

test("blog: draft hidden, publish requires content, published visible, unpublish hides", async () => {
  const created = await admin("POST", "/admin/blog-posts", { title: `E2E Journal ${RUN}` });
  assert.equal(created.status, 201);
  state.blogPostId = created.body.id;
  const slug = created.body.slug;
  assert.equal((await pub("GET", `/blog/${slug}`)).status, 404);

  const incomplete = await admin("PATCH", `/admin/blog-posts/${state.blogPostId}`, { status: "PUBLISHED" });
  assert.equal(incomplete.status, 422);
  assert.ok(incomplete.body.fieldErrors.content && incomplete.body.fieldErrors.coverImageUrl);

  const published = await admin("PATCH", `/admin/blog-posts/${state.blogPostId}`, {
    status: "PUBLISHED",
    excerpt: "Short teaser.",
    content: "# Hello\n\nReal body.",
    coverImageUrl: state.imageUrl,
  });
  assert.equal(published.status, 200);
  const article = await pub("GET", `/blog/${slug}`);
  assert.equal(article.status, 200);
  assert.equal(article.body.content, "# Hello\n\nReal body.");
  const list = await pub("GET", "/blog?pageSize=50");
  assert.ok(list.body.items.some((post) => post.slug === slug));
  assert.equal("content" in list.body.items[0], false, "list omits article bodies");

  const scheduled = await admin("PATCH", `/admin/blog-posts/${state.blogPostId}`, { publishedAt: new Date(Date.now() + 86_400_000).toISOString() });
  assert.equal(scheduled.status, 200);
  assert.equal((await pub("GET", `/blog/${slug}`)).status, 404, "future publish date = scheduled, not public yet");

  await admin("PATCH", `/admin/blog-posts/${state.blogPostId}`, { status: "DRAFT", publishedAt: null });
  assert.equal((await pub("GET", `/blog/${slug}`)).status, 404);
});

// ---------------------------------------------------------------------------
// Contact + newsletter
// ---------------------------------------------------------------------------

test("contact form: validated, stored, visible and manageable in the admin inbox", async () => {
  const invalid = await pub("POST", "/contact", { name: "A", email: "not-an-email", subject: "Hi", message: "Hello" });
  assert.equal(invalid.status, 422);
  assert.ok(invalid.body.fieldErrors.email);

  const sent = await pub("POST", "/contact", { name: "E2E Visitor", email: `visitor-${RUN}@example.com`, subject: `E2E ${RUN}`, message: "Do you ship abroad?" });
  assert.equal(sent.status, 201);
  state.messageId = sent.body.id;

  const inbox = await admin("GET", `/admin/contact-messages?search=E2E ${RUN}`);
  assert.equal(inbox.body.items[0].status, "NEW");
  const opened = await admin("GET", `/admin/contact-messages/${state.messageId}`);
  assert.equal(opened.body.status, "READ", "opening marks it read");
  const replied = await admin("PATCH", `/admin/contact-messages/${state.messageId}`, { status: "REPLIED", internalNote: "Answered" });
  assert.equal(replied.body.status, "REPLIED");

  assert.equal((await call("GET", "/admin/contact-messages", undefined, { auth: "" })).status, 401, "inbox is not public");
});

test("newsletter: subscribe, duplicate handled gracefully, admin sees one record", async () => {
  const email = `E2E-News-${RUN}@Example.com`;
  const first = await pub("POST", "/newsletter", { email });
  assert.equal(first.status, 201);
  assert.equal(first.body.status, "subscribed");
  const second = await pub("POST", "/newsletter", { email: email.toLowerCase() });
  assert.equal(second.status, 200);
  assert.equal(second.body.status, "already_subscribed");
  const invalid = await pub("POST", "/newsletter", { email: "nope" });
  assert.equal(invalid.status, 422);

  const list = await admin("GET", `/admin/newsletter-subscribers?search=e2e-news-${RUN}`);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.items[0].email, email.toLowerCase(), "emails are normalised");
  state.subscriberId = list.body.items[0].id;
});

// ---------------------------------------------------------------------------
// Content + Outfit Finder
// ---------------------------------------------------------------------------

test("content: announcement change is served by the public API", async () => {
  const before = (await admin("GET", "/admin/storefront-config")).body;
  state.configBefore = {
    announcementEnabled: before.announcementEnabled,
    announcementMessage: before.announcementMessage,
  };
  const message = `E2E announcement ${RUN}`;
  const saved = await admin("PATCH", "/admin/storefront-config", { announcementEnabled: true, announcementMessage: message });
  assert.equal(saved.status, 200);
  assert.equal((await pub("GET", "")).body.announcement.message, message);

  await admin("PATCH", "/admin/storefront-config", { announcementEnabled: false });
  assert.equal((await pub("GET", "")).body.announcement, null);

  const badLink = await admin("PATCH", "/admin/storefront-config", { announcementLinkHref: "javascript:alert(1)" });
  assert.equal(badLink.status, 422, "unsafe links are rejected");
});

test("outfit finder: options and database-backed recommendation", async () => {
  const options = (await pub("GET", "/outfit-finder")).body;
  assert.ok(options.bodyTypes.length && options.skinTones.length && options.occasions.length);
  const input = { bodyType: options.bodyTypes[0].key, skinTone: options.skinTones[0].key, occasion: options.occasions[0].key };
  const recommendation = await pub("POST", "/outfit-finder/recommendations", input);
  assert.equal(recommendation.status, 200, JSON.stringify(recommendation.body));
  assert.ok(recommendation.body.styleName);
  assert.ok([...recommendation.body.recommendedProducts, ...recommendation.body.completeTheLook].every((product) => product.slug));

  const unknown = await pub("POST", "/outfit-finder/recommendations", { ...input, occasion: "moon-landing" });
  assert.equal(unknown.status, 422);
});

// ---------------------------------------------------------------------------
// Tenant isolation
// ---------------------------------------------------------------------------

test("another organization's admin cannot read or change this organization's data", { skip: !process.env.E2E_OTHER_ADMIN_EMAIL }, async () => {
  const otherCookie = await login(process.env.E2E_OTHER_ADMIN_EMAIL, process.env.E2E_OTHER_ADMIN_PASSWORD);
  const read = await call("GET", `/admin/products/${state.productId}`, undefined, { auth: otherCookie });
  assert.equal(read.status, 404);
  const write = await call("POST", "/admin/products/bulk-unpublish", { ids: [state.productId] }, { auth: otherCookie });
  assert.equal(write.status, 204, "bulk endpoints are scoped and silently ignore foreign ids");
  assert.equal((await pub("GET", `/products/${state.productSlug}`)).status, 200, "product is still published");
});
