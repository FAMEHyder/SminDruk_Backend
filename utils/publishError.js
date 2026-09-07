const RECONNECT_ACCOUNT_MESSAGE = "Reconnect your account once and try again.";

const RECONNECT_PATTERNS = [
  "access token",
  "session has expired",
  "session has been invalidated",
  "token expired",
  "expired token",
  "expired_access_token",
  "token has expired",
  "token decrypt",
  "decrypt failed",
  "bad decrypt",
  "invalid_token",
  "invalid token",
  "error validating access token",
  "could not authenticate",
  "reconnect your account",
  "reconnect the account",
  "please reconnect",
];

const TOKEN_EXPIRY_CODES = [102, 190, 458, 463, 467, 492];

const isReconnectRequiredError = (error) => {
  const graphError = error?.response?.data?.error;
  const codes = [Number(graphError?.code), Number(graphError?.error_subcode)];
  if (codes.some((code) => TOKEN_EXPIRY_CODES.includes(code))) return true;
  const status = Number(error?.response?.status);
  if (status === 401) return true;
  const text = [
    graphError?.message,
    error?.response?.data?.detail,
    error?.response?.data?.title,
    error?.response?.data?.message,
    error?.response?.data?.code,
    error?.message,
    typeof error === "string" ? error : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return RECONNECT_PATTERNS.some((pattern) => text.includes(pattern));
};

const publishErrorMessage = (error, fallback = "Publish failed.") => {
  if (isReconnectRequiredError(error)) return RECONNECT_ACCOUNT_MESSAGE;
  if (typeof error === "string" && error) return error;
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export { RECONNECT_ACCOUNT_MESSAGE, isReconnectRequiredError, publishErrorMessage };
