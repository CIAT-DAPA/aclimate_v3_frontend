import { NextRequest, NextResponse } from "next/server";

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL!;
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM!;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET!;

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const grantType = body.get("grant_type");

  if (!grantType) {
    return NextResponse.json({ error: "grant_type is required" }, { status: 400 });
  }

  const params = new URLSearchParams();
  for (const [key, value] of body.entries()) {
    if (key !== "client_secret") {
      params.set(key, value.toString());
    }
  }

  params.set("client_secret", KEYCLOAK_CLIENT_SECRET);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json(data);
}
