-- Storefront integration: CMS content, blog, inbox, newsletter, outfit finder,
-- media, order workflow and variant normalization.
--
-- Hand-edited from `prisma migrate diff` so it is safe on a database that
-- already holds data: no rows are deleted, new NOT NULL columns are backfilled
-- before the constraint is applied, and the old FULFILLED order status is
-- mapped to DELIVERED instead of failing the cast.

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "NavigationLocation" AS ENUM ('HEADER', 'FOOTER');

-- CreateEnum
CREATE TYPE "OutfitOptionType" AS ENUM ('BODY_TYPE', 'SKIN_TONE', 'OCCASION');

-- AlterEnum: OrderStatus FULFILLED -> SHIPPED/DELIVERED workflow.
-- Existing FULFILLED orders were complete, so they become DELIVERED.
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text WHEN 'FULFILLED' THEN 'DELIVERED' ELSE "status"::text END
)::"OrderStatus_new";
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageAlt" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "color" TEXT,
ADD COLUMN     "compareAtPrice" DOUBLE PRECISION,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "productSlug" TEXT,
ADD COLUMN     "size" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'cod',
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "color" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "optionKey" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "size" TEXT;

-- Backfill: organization from the owning product.
UPDATE "product_variants" v SET "organizationId" = p."organizationId"
FROM "products" p WHERE p."id" = v."productId";

-- Backfill: size / color from the options JSON ([{name, value}]).
UPDATE "product_variants" v SET
  "size" = (SELECT e->>'value' FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v."options") = 'array' THEN v."options" ELSE '[]'::jsonb END) e WHERE lower(trim(e->>'name')) = 'size' LIMIT 1),
  "color" = (SELECT e->>'value' FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v."options") = 'array' THEN v."options" ELSE '[]'::jsonb END) e WHERE lower(trim(e->>'name')) IN ('color', 'colour') LIMIT 1);

-- Backfill: normalized option key, identical to variantOptionKey() in lib/server/variants.ts.
UPDATE "product_variants" v SET "optionKey" = COALESCE(
  (SELECT string_agg(lower(trim(e->>'name')) || '=' || lower(trim(e->>'value')), '|' ORDER BY lower(trim(e->>'name')))
   FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v."options") = 'array' THEN v."options" ELSE '[]'::jsonb END) e),
  'legacy-' || v."id");

ALTER TABLE "product_variants" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "product_variants" ALTER COLUMN "optionKey" SET NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "featuredPosition" INTEGER,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT NOT NULL DEFAULT '';

-- Backfill: published products get a publish date so "new arrivals" can sort them.
UPDATE "products" SET "publishedAt" = "updatedAt" WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NULL;
UPDATE "products" SET "features" = ARRAY[]::TEXT[] WHERE "features" IS NULL;

-- AlterTable
ALTER TABLE "storefront_configs" ADD COLUMN     "addressLines" TEXT[],
ADD COLUMN     "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "announcementHighlight" TEXT,
ADD COLUMN     "announcementLinkHref" TEXT,
ADD COLUMN     "announcementLinkLabel" TEXT,
ADD COLUMN     "announcementMessage" TEXT,
ADD COLUMN     "announcementShowPhone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "heroBadgeText" TEXT,
ADD COLUMN     "heroCtaHref" TEXT,
ADD COLUMN     "heroCtaLabel" TEXT,
ADD COLUMN     "heroImageAlt" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mapEmbedUrl" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "siteUrl" TEXT,
ADD COLUMN     "workingHours" TEXT;

UPDATE "storefront_configs" SET "addressLines" = ARRAY[]::TEXT[] WHERE "addressLines" IS NULL;

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_links" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "location" "NavigationLocation" NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_contents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT NOT NULL DEFAULT '',
    "authorName" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "source" TEXT NOT NULL DEFAULT 'website',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_options" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "OutfitOptionType" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hex" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outfit_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_looks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "occasionId" TEXT NOT NULL,
    "styleName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "heroProductId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_looks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_look_conditions" (
    "lookId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "style_look_conditions_pkey" PRIMARY KEY ("lookId","optionId")
);

-- CreateTable
CREATE TABLE "style_look_products" (
    "lookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "style_look_products_pkey" PRIMARY KEY ("lookId","productId")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "navigation_links_organizationId_location_position_idx" ON "navigation_links"("organizationId", "location", "position");

-- CreateIndex
CREATE UNIQUE INDEX "page_contents_organizationId_key_key" ON "page_contents"("organizationId", "key");

-- CreateIndex
CREATE INDEX "team_members_organizationId_position_idx" ON "team_members"("organizationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_organizationId_slug_key" ON "blog_categories"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "blog_posts_organizationId_status_publishedAt_idx" ON "blog_posts"("organizationId", "status", "publishedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_organizationId_slug_key" ON "blog_posts"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "contact_messages_organizationId_status_createdAt_idx" ON "contact_messages"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_organizationId_status_createdAt_idx" ON "newsletter_subscribers"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_organizationId_email_key" ON "newsletter_subscribers"("organizationId", "email");

-- CreateIndex
CREATE INDEX "outfit_options_organizationId_type_position_idx" ON "outfit_options"("organizationId", "type", "position");

-- CreateIndex
CREATE UNIQUE INDEX "outfit_options_organizationId_type_key_key" ON "outfit_options"("organizationId", "type", "key");

-- CreateIndex
CREATE INDEX "style_looks_organizationId_occasionId_isActive_idx" ON "style_looks"("organizationId", "occasionId", "isActive");

-- CreateIndex
CREATE INDEX "media_assets_organizationId_createdAt_idx" ON "media_assets"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "categories_organizationId_isActive_position_idx" ON "categories"("organizationId", "isActive", "position");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_accessToken_key" ON "orders"("accessToken");

-- CreateIndex
CREATE INDEX "orders_organizationId_shippingEmail_idx" ON "orders"("organizationId", "shippingEmail");

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "product_variants_organizationId_size_idx" ON "product_variants"("organizationId", "size");

-- CreateIndex
CREATE INDEX "product_variants_organizationId_color_idx" ON "product_variants"("organizationId", "color");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_optionKey_key" ON "product_variants"("productId", "optionKey");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_organizationId_sku_key" ON "product_variants"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "products_organizationId_status_isFeatured_featuredPosition_idx" ON "products"("organizationId", "status", "isFeatured", "featuredPosition");

-- CreateIndex
CREATE INDEX "products_organizationId_status_price_idx" ON "products"("organizationId", "status", "price");

-- CreateIndex
CREATE UNIQUE INDEX "products_organizationId_sku_key" ON "products"("organizationId", "sku");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one history row per existing order recording its current status.
INSERT INTO "order_status_history" ("id", "orderId", "fromStatus", "toStatus", "note", "createdAt")
SELECT 'mig_' || o."id", o."id", NULL, o."status", 'Status recorded during migration', o."updatedAt" FROM "orders" o;

UPDATE "orders" SET "deliveredAt" = "updatedAt" WHERE "status" = 'DELIVERED' AND "deliveredAt" IS NULL;

-- AddForeignKey
ALTER TABLE "navigation_links" ADD CONSTRAINT "navigation_links_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_contents" ADD CONSTRAINT "page_contents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_options" ADD CONSTRAINT "outfit_options_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_looks" ADD CONSTRAINT "style_looks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_looks" ADD CONSTRAINT "style_looks_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "outfit_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_looks" ADD CONSTRAINT "style_looks_heroProductId_fkey" FOREIGN KEY ("heroProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_look_conditions" ADD CONSTRAINT "style_look_conditions_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "style_looks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_look_conditions" ADD CONSTRAINT "style_look_conditions_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "outfit_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_look_products" ADD CONSTRAINT "style_look_products_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "style_looks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_look_products" ADD CONSTRAINT "style_look_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

