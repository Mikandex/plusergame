function asErrorText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.map(asErrorText).filter((part): part is string => Boolean(part));
    return parts.length ? parts.join(". ") : undefined;
  }
  if (value && typeof value === "object") {
    const parts = Object.values(value as Record<string, unknown>)
      .map(asErrorText)
      .filter((part): part is string => Boolean(part));
    return parts.length ? parts.join(". ") : undefined;
  }
  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const err = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: unknown;
        error?: unknown;
        errors?: unknown;
      };
    };
  };

  const data = err.response?.data;

  if (!err.response) {
    if (!process.env.EXPO_PUBLIC_SERVER_URI) {
      return "API URL is not configured. Add EXPO_PUBLIC_SERVER_URI to your .env file.";
    }
    return err.message || "Network error. Check your connection and try again.";
  }

  return (
    asErrorText(data?.message) ||
    asErrorText(data?.error) ||
    asErrorText(data?.errors) ||
    fallback
  );
}

export function getApiErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  return (error as { response?: { status?: number } }).response?.status;
}

export function isUnverifiedAccountMessage(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("not verified") ||
    lower.includes("not yet verified") ||
    lower.includes("verification code") ||
    lower.includes("verify your account")
  );
}
