# Organization and storefront onboarding

This guide covers the current FashionSaas Admin workflow: create an organization, give its owner access, configure the storefront, and publish products. The Admin app provides a public storefront preview at `/store/{organization-slug}`. A separately deployed FashionSaas storefront is connected to one organization by its `NEXT_PUBLIC_STORE_SLUG` setting; deployment and custom-domain setup are operator tasks.

## 1. Create an organization

1. Sign in to the Admin app with a **Super Admin** account.
2. Open **Organizations** and select **New organization**.
3. Enter the organization name and any available description/contact details.
4. Enter the organization administrator's name, email, and an initial password of at least 8 characters.
5. Select **Create organization**.

Creation also creates the organization administrator account, organization settings, and the initial storefront configuration. The app derives a URL-safe slug from the organization name. If that slug is already taken, it adds a number (for example, `north-star`, then `north-star-2`). The slug is the storefront's stable identifier; record it and avoid renaming it after sharing the link.

The form displays the new organization record after creation. Share the sign-in URL and initial password with the owner using a secure channel. The owner signs in with the administrator email and password; the account is scoped to its organization. The current form does not send an invitation email or automatically issue a password reset link.

## 2. Share the storefront link

The built-in storefront preview is:

```text
https://<admin-domain>/store/<organization-slug>
```

For local development, for example:

```text
http://localhost:3000/store/north-star
```

The link uses the slug shown on the organization record, not the organization's display name. The store must be **Active** to load publicly. A suspended organization returns a not-found page.

If using the separate FashionSaas storefront repository, configure its deployment with:

```env
NEXT_PUBLIC_API_BASE_URL=https://<admin-domain>
NEXT_PUBLIC_STORE_SLUG=<organization-slug>
NEXT_PUBLIC_SITE_URL=https://<storefront-domain>
```

That setting makes the separate deployment load the selected organization's data. The Admin app does not currently provision a separate deployment, assign a custom domain, or send DNS instructions automatically. Set the storefront's exact origin in the Admin app's `STOREFRONT_ORIGINS` CORS allow-list. For cache invalidation, configure the matching `STOREFRONT_REVALIDATE_URL` and `STOREFRONT_REVALIDATE_SECRET` / `REVALIDATE_SECRET` values described in [INTEGRATION.md](INTEGRATION.md). A deployed standalone store can be hosted at its own domain; the built-in preview remains on the Admin app domain.

## 3. Set up the storefront in Admin

Sign in as the organization administrator and use the dashboard navigation. Changes are scoped to that organization.

1. **Store details and brand:** open **Content** and update store name, description, contact information, logo, announcement, hero copy/image, SEO, and social links where those fields are available.
2. **Store navigation:** set the header and footer links under the navigation controls in **Content**. Keep destinations aligned with routes/pages that exist in the storefront.
3. **Categories:** open **Categories** and add the categories shoppers will use. Set names, descriptions, images, display order, and active status. Categories without active status are not shown publicly.
4. **Store settings:** open **Settings** and confirm currency, tax, shipping, and order settings before accepting orders.
5. **Pages and media:** use **Content** to fill the About page and team section. Upload reusable assets in **Media Library**, or upload images directly in the relevant editor. Media uploaded in Admin is served from the Admin host and can be selected in storefront content.
6. **Optional content:** add and publish blog posts and categories, configure Outfit Finder options/looks, and check the inbox/newsletter pages as needed.

The storefront has image locations for the hero, categories, products, About content/team, and blog covers. Fill those image fields with the appropriate uploaded media; the integration returns the saved media URLs to the storefront. Empty image fields remain empty until the owner adds an asset.

## 4. Add and publish products

1. Open **Products** → **Add product**.
2. Fill in the product title, description/summary, product type, price, optional comparison price, SKU, and inventory/variant details.
3. Assign one or more categories so shoppers can find the product in the catalog.
4. Add product photos in **Media**. Reorder them to choose the primary image and provide useful alt text where supported.
5. Set visibility to **Published** (or save as a draft and publish later). A published product needs a price greater than zero and at least one image.
6. Save the product. Published products appear in the store catalog; featured products can be enabled and ordered in the product form.

To update a listing, edit it from **Products** and save. To temporarily remove it from the public catalog, unpublish it or return it to draft. Use **Inventory** to adjust stock. Keep variant sizes, colors, and inventory current; the storefront uses those values for product options and availability.

## 5. Confirm the store is ready

- Open `/store/{organization-slug}` in a private browser window and confirm the page loads.
- Check that the store name, contact details, navigation, categories, product images, prices, and variants are correct.
- Confirm products intended for shoppers are published and have a price and image.
- Place a test order only after confirming currency, tax, shipping, and the supported payment method. The current integration supports cash on delivery and does not collect card payments.
- If a recent edit is not visible immediately, allow up to about 60 seconds for storefront caching to refresh; configured on-demand revalidation can make it faster.

## Current limitations

- Organization creation is performed by a Super Admin. There is no public self-serve organization signup flow.
- The initial password is manually provided to the organization; automatic invitation email and owner password-change-on-first-login are not currently part of this flow.
- The unique built-in link is based on the generated organization slug. Custom-domain provisioning and per-organization standalone storefront deployment are not automated.
- Only published products and active categories are public. Publishing a product requires a price and at least one image.
- Customer accounts and online card payments are not implemented; orders use guest checkout.

