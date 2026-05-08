import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "../query/me.query";
import { isUnauthenticatedError } from "@/shared/api/graphql/auth-errors";
import {
  clearSessionTokens,
  getAccessToken,
} from "@/shared/lib/storage";

type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  baseCvId?: number | null;
};

export function useSession() {
  const accessToken = getAccessToken();
  const query = useQuery<{ me: CurrentUser | null }>(ME_QUERY, {
    skip: !accessToken,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const hasAuthError = isUnauthenticatedError(query.error);
  const user = query.data?.me ?? null;
  const isSessionLoading = Boolean(accessToken && query.loading && !user);
  const isSessionUnavailable = Boolean(accessToken && query.error && !hasAuthError);

  const logout = () => {
    clearSessionTokens();
    location.href = "/";
  };

  return {
    user,
    isAuthenticated: Boolean(user && !hasAuthError),
    isSessionLoading,
    isSessionUnavailable,
    logout,
  };
}
