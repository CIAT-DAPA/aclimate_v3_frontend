import { NextRequest } from "next/server";

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const urlObj = new URL(req.url);
    const params = new URLSearchParams(urlObj.search);

    const proxyTo = params.get("proxyTo") || params.get("url") || params.get("target");
    if (!proxyTo) {
      return new Response("Missing proxyTo/url/target query parameter", { status: 400 });
    }

    // Remove proxy keys to build the rest of query string
    params.delete("proxyTo");
    params.delete("url");
    params.delete("target");

    const rest = params.toString();
    const separator = proxyTo.includes("?") ? "&" : "?";
    const target = rest ? `${proxyTo}${separator}${rest}` : proxyTo;

    const resp = await fetch(target);
    const contentType = resp.headers.get("content-type");
    const buffer = await resp.arrayBuffer();

    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    };
    if (contentType) headers["content-type"] = contentType;

    return new Response(buffer, { status: resp.status, headers });
  } catch (err: any) {
    return new Response(String(err?.message || err), { status: 500 });
  }
}
