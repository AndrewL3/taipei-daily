import { useQuery } from "@tanstack/react-query";
import { fetchAdminStatus } from "./client";

export function useAdminStatus(token: string | null) {
  return useQuery({
    queryKey: ["admin-status", token],
    queryFn: () => fetchAdminStatus(token!),
    enabled: !!token,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
