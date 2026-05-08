import { CombinedGraphQLErrors } from "@apollo/client";

const AUTH_ERROR_MESSAGES = [
  "Invalid token",
  "No token provided",
  "jwt expired",
  "User not found",
] as const;

export function isUnauthenticatedError(error: unknown) {
  return CombinedGraphQLErrors.is(error)
    ? error.errors.some((graphQLError) => {
        const code = graphQLError.extensions?.code;
        const message = graphQLError.message ?? "";

        return (
          code === "UNAUTHENTICATED" ||
          code === 401 ||
          AUTH_ERROR_MESSAGES.some((authMessage) =>
            message.includes(authMessage),
          )
        );
      })
    : false;
}
