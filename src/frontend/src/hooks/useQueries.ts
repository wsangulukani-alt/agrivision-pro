import {
  type ArticleStatus,
  type Crop,
  type NewsArticle,
  type RegionalFocus,
  type Sale,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Returns the current caller's assigned role from the backend. */
export function useCallerUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns whether the current caller is an admin. */
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all recorded sales transactions. */
export function useSales() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSales();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Records a new sale transaction and returns the assigned id. */
export function useAddSale() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sale: Sale) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addSale(sale);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

/** Returns all crops registered on the platform. */
export function useCrops() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["crops"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCrops();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all farms registered on the platform. */
export function useFarms() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["farms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFarms();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all payments recorded on the platform. */
export function usePayments() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all production cycles on the platform. */
export function useProductionCycles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["productionCycles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProductionCycles();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all inventory items on the platform. */
export function useInventoryItems() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["inventoryItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listInventoryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all news articles on the platform. */
export function useNewsArticles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["newsArticles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNewsArticles();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Updates an existing news article and returns the updated article. */
export function useUpdateNewsArticle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      headline: string;
      subHeadline: string;
      body: string;
      regionalFocus: RegionalFocus;
      relatedCrops: string[];
      tags: string[];
      status: ArticleStatus;
      scheduledPublishDate: bigint | null;
      bannerImage: string;
    }): Promise<NewsArticle | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateNewsArticle(
        args.id,
        args.headline,
        args.subHeadline,
        args.body,
        args.regionalFocus,
        args.relatedCrops,
        args.tags,
        args.status,
        args.scheduledPublishDate,
        args.bannerImage,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["newsArticles"] });
    },
  });
}

/** Updates an existing crop record. */
export function useUpdateCrop() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crop: Crop) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateCrop(crop);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["crops"] });
    },
  });
}

/** Returns all support requests on the platform. */
export function useSupportRequests() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["supportRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSupportRequests();
    },
    enabled: !!actor && !isFetching,
  });
}
