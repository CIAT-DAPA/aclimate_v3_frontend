import { NextRequest, NextResponse } from "next/server";

function toPlainObject(params: URLSearchParams): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    output[key] = key === "client_secret" ? "[REDACTED]" : value;
  }
  return output;
}

export async function POST(request: NextRequest) {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
  const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!keycloakUrl || !keycloakRealm || !keycloakClientSecret) {
    return NextResponse.json(
      {
        error: "Server auth configuration is incomplete",
        missing: {
          NEXT_PUBLIC_KEYCLOAK_URL: !keycloakUrl,
          NEXT_PUBLIC_KEYCLOAK_REALM: !keycloakRealm,
          KEYCLOAK_CLIENT_SECRET: !keycloakClientSecret,
        },
      },
      { status: 500 },
    );
  }

  const tokenEndpoint = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;
  const contentType = request.headers.get("content-type") || "";

  const incomingParams = new URLSearchParams();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const rawBody = await request.text();
    const parsed = new URLSearchParams(rawBody);
    for (const [key, value] of parsed.entries()) {
      incomingParams.set(key, value);
    }
  } else {
    const body = await request.formData();
    for (const [key, value] of body.entries()) {
      incomingParams.set(key, value.toString());
    }
  }

  const grantType = incomingParams.get("grant_type");

  if (!grantType) {
    return NextResponse.json({ error: "grant_type is required" }, { status: 400 });
  }

  const params = new URLSearchParams();
  for (const [key, value] of incomingParams.entries()) {
    if (key !== "client_secret") {
      params.set(key, value);
    }
  }

  params.set("client_secret", keycloakClientSecret);

  let response: Response;
  try {
    response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to reach Keycloak token endpoint",
        tokenEndpoint,
        detail: error instanceof Error ? error.message : "Unknown fetch error",
      },
      { status: 502 },
    );
  }

  const raw = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Keycloak rejected token request",
        status: response.status,
        upstream: data,
        request: toPlainObject(params),
      },
      { status: response.status },
    );
  }

  return NextResponse.json(data, { status: 200 });
}
