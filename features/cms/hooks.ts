import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  blogKeys,
  contentKeys,
  inboxKeys,
  notificationKeys,
  outfitFinderKeys,
  subscriberKeys,
} from "@/services/queries/query-keys";
import * as api from "./services/cms.service";
import type { BlogQueryParams, InboxQueryParams, SubscriberQueryParams } from "./types";

/** Mutation that refetches the given query keys on success, so screens always show persisted data. */
function useInvalidatingMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  keys: QueryKey[]
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

// Content
export const useNavigation = () => useQuery({ queryKey: contentKeys.navigation(), queryFn: api.getNavigation });
export const useSaveNavigation = () => useInvalidatingMutation(api.saveNavigation, [contentKeys.navigation()]);

export const usePage = <T>(key: string) =>
  useQuery({ queryKey: contentKeys.page(key), queryFn: () => api.getPage<T>(key) });
export const useSavePage = <T>(key: string) =>
  useInvalidatingMutation((content: T) => api.savePage<T>(key, content), [contentKeys.page(key)]);

export const useTeamMembers = () => useQuery({ queryKey: contentKeys.team(), queryFn: api.getTeamMembers });
export const useCreateTeamMember = () => useInvalidatingMutation(api.createTeamMember, [contentKeys.team()]);
export const useUpdateTeamMember = () =>
  useInvalidatingMutation(
    ({ id, ...input }: { id: string } & Parameters<typeof api.updateTeamMember>[1]) => api.updateTeamMember(id, input),
    [contentKeys.team()]
  );
export const useDeleteTeamMember = () => useInvalidatingMutation(api.deleteTeamMember, [contentKeys.team()]);

// Blog
export const useBlogPosts = (params: BlogQueryParams) =>
  useQuery({ queryKey: blogKeys.list(params), queryFn: () => api.getBlogPosts(params), placeholderData: keepPreviousData });
export const useBlogPost = (id: string | null) =>
  useQuery({ queryKey: blogKeys.detail(id ?? ""), queryFn: () => api.getBlogPost(id!), enabled: Boolean(id) });
export const useCreateBlogPost = () => useInvalidatingMutation(api.createBlogPost, [blogKeys.all]);
export const useUpdateBlogPost = () =>
  useInvalidatingMutation(
    ({ id, ...input }: { id: string } & Parameters<typeof api.updateBlogPost>[1]) => api.updateBlogPost(id, input),
    [blogKeys.all]
  );
export const useDeleteBlogPost = () => useInvalidatingMutation(api.deleteBlogPost, [blogKeys.all]);
export const useBlogCategories = () => useQuery({ queryKey: blogKeys.categories(), queryFn: api.getBlogCategories });
export const useCreateBlogCategory = () => useInvalidatingMutation(api.createBlogCategory, [blogKeys.all]);
export const useDeleteBlogCategory = () => useInvalidatingMutation(api.deleteBlogCategory, [blogKeys.all]);

// Inbox
export const useContactMessages = (params: InboxQueryParams) =>
  useQuery({ queryKey: inboxKeys.list(params), queryFn: () => api.getContactMessages(params), placeholderData: keepPreviousData });
export const useContactMessage = (id: string | null) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: inboxKeys.detail(id ?? ""),
    queryFn: async () => {
      // Opening a message marks it read on the server; refresh list counts.
      const message = await api.getContactMessage(id!);
      void queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, "list"] });
      return message;
    },
    enabled: Boolean(id),
  });
};
export const useUpdateContactMessage = () =>
  useInvalidatingMutation(
    ({ id, ...input }: { id: string } & Parameters<typeof api.updateContactMessage>[1]) => api.updateContactMessage(id, input),
    [inboxKeys.all, notificationKeys.all]
  );
export const useDeleteContactMessage = () => useInvalidatingMutation(api.deleteContactMessage, [inboxKeys.all]);

// Newsletter
export const useSubscribers = (params: SubscriberQueryParams) =>
  useQuery({ queryKey: subscriberKeys.list(params), queryFn: () => api.getSubscribers(params), placeholderData: keepPreviousData });
export const useSetSubscriberStatus = () =>
  useInvalidatingMutation(
    ({ id, status }: { id: string; status: Parameters<typeof api.setSubscriberStatus>[1] }) => api.setSubscriberStatus(id, status),
    [subscriberKeys.all]
  );
export const useDeleteSubscriber = () => useInvalidatingMutation(api.deleteSubscriber, [subscriberKeys.all]);

// Outfit finder
export const useOutfitOptions = () => useQuery({ queryKey: outfitFinderKeys.options(), queryFn: api.getOutfitOptions });
export const useCreateOutfitOption = () => useInvalidatingMutation(api.createOutfitOption, [outfitFinderKeys.all]);
export const useUpdateOutfitOption = () =>
  useInvalidatingMutation(
    ({ id, ...input }: { id: string } & Parameters<typeof api.updateOutfitOption>[1]) => api.updateOutfitOption(id, input),
    [outfitFinderKeys.all]
  );
export const useDeleteOutfitOption = () => useInvalidatingMutation(api.deleteOutfitOption, [outfitFinderKeys.all]);
export const useStyleLooks = () => useQuery({ queryKey: outfitFinderKeys.looks(), queryFn: api.getStyleLooks });
export const useCreateStyleLook = () => useInvalidatingMutation(api.createStyleLook, [outfitFinderKeys.all]);
export const useUpdateStyleLook = () =>
  useInvalidatingMutation(
    ({ id, ...input }: { id: string } & Parameters<typeof api.updateStyleLook>[1]) => api.updateStyleLook(id, input),
    [outfitFinderKeys.all]
  );
export const useDeleteStyleLook = () => useInvalidatingMutation(api.deleteStyleLook, [outfitFinderKeys.all]);
