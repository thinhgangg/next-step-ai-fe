import { Observable } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import {
  clearExpiredSession,
  refreshAccessToken,
  RefreshTokenNetworkError,
} from "@/features/auth/api/refresh-token";
import { isUnauthenticatedError } from "./auth-errors";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;

  window.location.replace("/login");
}

export const errorLink = onError(({ error, operation, forward }) => {
  const hasUnauthenticatedError = isUnauthenticatedError(error);

  if (hasUnauthenticatedError && !operation.getContext().didTryRefreshToken) {
    return new Observable((observer) => {
      let subscription: { unsubscribe: () => void } | undefined;

      refreshAccessToken()
        .then((accessToken) => {
          if (!accessToken) {
            clearExpiredSession();
            redirectToLogin();
            observer.error(error);
            return;
          }

          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              authorization: `Bearer ${accessToken}`,
            },
            didTryRefreshToken: true,
          }));

          subscription = forward(operation).subscribe(observer);
        })
        .catch((refreshError) => {
          if (refreshError instanceof RefreshTokenNetworkError) {
            observer.error(error);
            return;
          }

          clearExpiredSession();
          redirectToLogin();
          observer.error(error);
        });

      return () => subscription?.unsubscribe();
    });
  }

  if (hasUnauthenticatedError) {
    clearExpiredSession();
    redirectToLogin();
    return;
  }

  if (error) {
    console.error("GraphQL error", error);
  }
});
