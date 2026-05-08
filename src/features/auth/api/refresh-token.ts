import { graphqlUrl } from "@/shared/api/graphql/config";
import {
  clearSessionTokens,
  getRefreshToken,
  setSessionTokens,
} from "@/shared/lib/storage";

type RefreshTokenResponse = {
  data?: {
    refreshToken?: {
      accessToken: string;
      refreshToken: string;
    };
  };
  errors?: Array<{ message?: string }>;
};

export class RefreshTokenNetworkError extends Error {
  constructor() {
    super("Could not reach auth server while refreshing token");
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function requestRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  let response: Response;

  try {
    response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: { refreshToken },
      }),
    });
  } catch {
    throw new RefreshTokenNetworkError();
  }

  if (!response.ok) return null;

  const payload = (await response.json()) as RefreshTokenResponse;
  const tokens = payload.data?.refreshToken;

  if (!tokens || payload.errors?.length) return null;

  setSessionTokens(tokens);
  return tokens.accessToken;
}

export async function refreshAccessToken() {
  refreshPromise ??= requestRefreshToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function clearExpiredSession() {
  clearSessionTokens();
  localStorage.setItem("nextstep.sessionExpired", "true");
}
