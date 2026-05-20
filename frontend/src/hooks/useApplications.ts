import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../api/client";
import type {
  Application,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  DecisionPayload,
} from "../types/application";

// Query key factory — centralises cache key structure
export const applicationKeys = {
  all: ["applications"] as const,
  filtered: (status: string) => ["applications", { status }] as const,
  detail: (id: number) => ["applications", id] as const,
};

export function useApplications(status?: string): UseQueryResult<Application[]> {
  return useQuery({
    queryKey: status ? applicationKeys.filtered(status) : applicationKeys.all,
    queryFn: () => {
      const url = status
        ? `/api/applications/?status=${encodeURIComponent(status)}`
        : "/api/applications/";
      return api.get<Application[]>(url);
    },
  });
}

export function useApplication(id: number): UseQueryResult<Application> {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => api.get<Application>(`/api/applications/${id}`),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) =>
      api.post<Application>("/api/applications/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicationKeys.all }),
  });
}

export function useUpdateApplication(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateApplicationPayload) =>
      api.patch<Application>(`/api/applications/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Application>(`/api/applications/${id}/submit`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useResubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Application>(`/api/applications/${id}/resubmit`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useStartReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Application>(`/api/applications/${id}/start-review`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useRecordDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DecisionPayload }) =>
      api.post<Application>(`/api/applications/${id}/decision`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}
