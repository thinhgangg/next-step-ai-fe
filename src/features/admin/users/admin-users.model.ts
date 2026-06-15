import { useQuery } from "@apollo/client/react";
import { ADMIN_USERS_QUERY } from "./admin-users.query";

export type AdminUserItem = {
  userId: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  currentRole?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  cvCount: number;
  scanCount: number;
};

type AdminUsersResponse = {
  adminUsers: AdminUserItem[];
};

export function useAdminUsers() {
  const query = useQuery<AdminUsersResponse>(ADMIN_USERS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  return {
    users: query.data?.adminUsers ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}
