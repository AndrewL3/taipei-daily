import { useQuery } from "@tanstack/react-query";
import { fetchAdminStatus } from "./client";

export function useAdminStatus(
  token: string | null,
  authVersion: number,
  onUnauthorized: () => void,
) {
  return useQuery({
    queryKey: ["admin-status", authVersion],
    queryFn: async () => {
      try {
        return await fetchAdminStatus(token!);
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          onUnauthorized();
        }
        throw error;
      }
    },
    enabled: !!token,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
