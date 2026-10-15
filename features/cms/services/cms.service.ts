import { apiClient } from "@/services/http-client";
import type { PaginatedResult } from "@/types/common";
import type {
  BlogCategory,
  BlogPost,
  BlogPostInput,
  BlogQueryParams,
  ContactMessage,
  ContactMessageList,
  ContactMessageStatus,
  InboxQueryParams,
  NavigationLinkInput,
  NavigationMenus,
  OutfitOption,
  OutfitOptionInput,
  PageContentResponse,
  StyleLook,
  StyleLookInput,
  Subscriber,
  SubscriberQueryParams,
  SubscriberStatus,
  TeamMember,
  TeamMemberInput,
} from "../types";

// Navigation, pages, team
export const getNavigation = () => apiClient.get<NavigationMenus>("/admin/navigation");
export const saveNavigation = (input: { header: NavigationLinkInput[]; footer: NavigationLinkInput[] }) =>
  apiClient.put<NavigationMenus>("/admin/navigation", { body: input });

export const getPage = <T>(key: string) => apiClient.get<PageContentResponse<T>>(`/admin/pages/${key}`);
export const savePage = <T>(key: string, content: T) =>
  apiClient.put<PageContentResponse<T>>(`/admin/pages/${key}`, { body: content });

export const getTeamMembers = () => apiClient.get<TeamMember[]>("/admin/team-members");
export const createTeamMember = (input: TeamMemberInput) => apiClient.post<TeamMember>("/admin/team-members", { body: input });
export const updateTeamMember = (id: string, input: Partial<TeamMemberInput>) =>
  apiClient.patch<TeamMember>(`/admin/team-members/${id}`, { body: input });
export const deleteTeamMember = (id: string) => apiClient.delete<void>(`/admin/team-members/${id}`);

// Blog
export const getBlogPosts = (params: BlogQueryParams) =>
  apiClient.get<PaginatedResult<BlogPost>>("/admin/blog-posts", { params });
export const getBlogPost = (id: string) => apiClient.get<BlogPost>(`/admin/blog-posts/${id}`);
export const createBlogPost = (input: BlogPostInput) => apiClient.post<BlogPost>("/admin/blog-posts", { body: input });
export const updateBlogPost = (id: string, input: Partial<BlogPostInput>) =>
  apiClient.patch<BlogPost>(`/admin/blog-posts/${id}`, { body: input });
export const deleteBlogPost = (id: string) => apiClient.delete<void>(`/admin/blog-posts/${id}`);
export const getBlogCategories = () => apiClient.get<BlogCategory[]>("/admin/blog-categories");
export const createBlogCategory = (name: string) => apiClient.post<BlogCategory>("/admin/blog-categories", { body: { name } });
export const deleteBlogCategory = (id: string) => apiClient.delete<void>(`/admin/blog-categories/${id}`);

// Inbox
export const getContactMessages = (params: InboxQueryParams) =>
  apiClient.get<ContactMessageList>("/admin/contact-messages", { params });
export const getContactMessage = (id: string) => apiClient.get<ContactMessage>(`/admin/contact-messages/${id}`);
export const updateContactMessage = (id: string, input: { status?: ContactMessageStatus; internalNote?: string | null }) =>
  apiClient.patch<ContactMessage>(`/admin/contact-messages/${id}`, { body: input });
export const deleteContactMessage = (id: string) => apiClient.delete<void>(`/admin/contact-messages/${id}`);

// Newsletter
export const getSubscribers = (params: SubscriberQueryParams) =>
  apiClient.get<PaginatedResult<Subscriber>>("/admin/newsletter-subscribers", { params });
export const setSubscriberStatus = (id: string, status: SubscriberStatus) =>
  apiClient.patch<Subscriber>(`/admin/newsletter-subscribers/${id}`, { body: { status } });
export const deleteSubscriber = (id: string) => apiClient.delete<void>(`/admin/newsletter-subscribers/${id}`);

// Outfit finder
export const getOutfitOptions = () => apiClient.get<OutfitOption[]>("/admin/outfit-finder/options");
export const createOutfitOption = (input: OutfitOptionInput) =>
  apiClient.post<OutfitOption>("/admin/outfit-finder/options", { body: input });
export const updateOutfitOption = (id: string, input: OutfitOptionInput) =>
  apiClient.patch<OutfitOption>(`/admin/outfit-finder/options/${id}`, { body: input });
export const deleteOutfitOption = (id: string) => apiClient.delete<void>(`/admin/outfit-finder/options/${id}`);
export const getStyleLooks = () => apiClient.get<StyleLook[]>("/admin/outfit-finder/looks");
export const createStyleLook = (input: StyleLookInput) =>
  apiClient.post<StyleLook>("/admin/outfit-finder/looks", { body: input });
export const updateStyleLook = (id: string, input: Partial<StyleLookInput>) =>
  apiClient.patch<StyleLook>(`/admin/outfit-finder/looks/${id}`, { body: input });
export const deleteStyleLook = (id: string) => apiClient.delete<void>(`/admin/outfit-finder/looks/${id}`);
