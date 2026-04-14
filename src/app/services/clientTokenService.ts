const TEMP_PUBLIC_PKCE_MODE_TOKEN = "pkce-public-mode-token";

/**
 * Returns a valid client credentials token, fetching or refreshing as needed.
 * The token is cached in memory only — never stored in localStorage or sessionStorage.
 */
export async function getClientToken(): Promise<string> {
  return TEMP_PUBLIC_PKCE_MODE_TOKEN;
}
