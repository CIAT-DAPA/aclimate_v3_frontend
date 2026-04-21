import { KEYCLOAK_CLIENT_ID } from "@/app/config";

interface CachedToken {
  accessToken: string;
  expiresAt: number; // ms since epoch
}

let cachedToken: CachedToken | null = null;

/**
 * Returns a valid client credentials token, fetching or refreshing as needed.
 * The token is cached in memory only — never stored in localStorage or sessionStorage.
 * Acquisition goes through /api/auth/token (server-side proxy) so client_secret
 * is never exposed to the browser.
 */
export async function getClientToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid with a 30-second buffer
  if (cachedToken && cachedToken.expiresAt - 30_000 > now) {
    return cachedToken.accessToken;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: KEYCLOAK_CLIENT_ID,
  });

  const response = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "(no body)");
    throw new Error(`Client token request failed [${response.status}]: ${detail}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Token response is missing access_token");
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in ?? 300) * 1000,
  };

  return cachedToken.accessToken;
}
