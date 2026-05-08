export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (message === "Failed to fetch") {
    return "Cannot connect to the server. Please try again later.";
  }

  return message || fallback;
}
