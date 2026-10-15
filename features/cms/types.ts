import type { PaginatedResult } from "@/types/common";

// Navigation / pages / team ---------------------------------------------------

export interface NavigationLinkInput {
  label: string;
  href: string;
  isVisible: boolean;
}

export interface NavigationLink extends NavigationLinkInput {
  id: string;
  position: number;
}

export interface NavigationMenus {
  header: NavigationLink[];
  footer: NavigationLink[];
}

export interface ImageWithAlt {
  url: string;
  alt: string;
}

export interface AboutPageContent {
  hero: { eyebrow: string; title: string; image: ImageWithAlt | null };
  story: { eyebrow: string; heading: string; body: string; images: ImageWithAlt[]; ctaLabel?: string | null; ctaHref?: string | null };
  quote: { text: string; author: string; role: string } | null;
  inspiration: { heading: string; body: string; image: ImageWithAlt | null; ctaLabel?: string | null; ctaHref?: string | null };
}

export interface PageContentResponse<T> {
  key: string;
  content: T | null;
  updatedAt: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
  position: number;
  isVisible: boolean;
}

export type TeamMemberInput = Partial<Omit<TeamMember, "id">> & { name: string };

// Blog -------------------------------------------------------------------------

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  authorName: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  status: ContentStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string;
  authorName?: string;
  categoryId?: string | null;
  status?: ContentStatus;
  isFeatured?: boolean;
  publishedAt?: string | null;
  seoTitle?: string;
  seoDescription?: string;
}

export interface BlogQueryParams {
  search: string;
  status: ContentStatus | "all";
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

// Inbox / newsletter -------------------------------------------------------------

export type ContactMessageStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageList extends PaginatedResult<ContactMessage> {
  unreadCount: number;
}

export interface InboxQueryParams {
  search: string;
  status: ContactMessageStatus | "all";
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

export type SubscriberStatus = "SUBSCRIBED" | "UNSUBSCRIBED";

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string;
  consentAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
}

export interface SubscriberQueryParams {
  search: string;
  status: SubscriberStatus | "all";
  page: number;
  pageSize: number;
  [key: string]: string | number | boolean | undefined;
}

// Outfit finder -------------------------------------------------------------------

export type OutfitOptionType = "BODY_TYPE" | "SKIN_TONE" | "OCCASION";

export interface OutfitOption {
  id: string;
  type: OutfitOptionType;
  key: string;
  label: string;
  hex: string | null;
  imageUrl: string | null;
  position: number;
  isActive: boolean;
}

export type OutfitOptionInput = Partial<Omit<OutfitOption, "id">>;

export interface StyleLook {
  id: string;
  occasionId: string;
  occasion: { id: string; key: string; label: string };
  styleName: string;
  description: string;
  tags: string[];
  heroProductId: string | null;
  heroProduct: { id: string; title: string; slug: string; status: string } | null;
  productIds: string[];
  products: { id: string; title: string; slug: string; status: string }[];
  bodyTypeIds: string[];
  skinToneIds: string[];
  position: number;
  isActive: boolean;
  updatedAt: string;
}

export interface StyleLookInput {
  occasionId: string;
  styleName: string;
  description?: string;
  tags?: string[];
  heroProductId?: string | null;
  productIds?: string[];
  bodyTypeIds?: string[];
  skinToneIds?: string[];
  position?: number;
  isActive?: boolean;
}
