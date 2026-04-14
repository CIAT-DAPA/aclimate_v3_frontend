interface ClientTokenResponse {
  access_token: string;
  expires_in: number;
  [key: string]: unknown;
}

// Singleton in-memory cache — never written to localStorage or sessionStorage
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;
// In-flight request deduplication: avoid parallel fetches
let inflightRequest: Promise<string> | null = null;

async function fetchClientToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing NEXT_PUBLIC_KEYCLOAK_CLIENT_ID env variable");
  }

  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", clientId);

  const response = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain client token: ${response.statusText}`);
  }

  const data: ClientTokenResponse = await response.json();

  cachedToken = data.access_token;
  // Refresh 60 seconds before actual expiry
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

/**
 * Returns a valid client credentials token, fetching or refreshing as needed.
 * The token is cached in memory only — never stored in localStorage or sessionStorage.
 */
export async function getClientToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  if (!inflightRequest) {
    inflightRequest = fetchClientToken().finally(() => {
      inflightRequest = null;
    });
  }

  return inflightRequest;
}
