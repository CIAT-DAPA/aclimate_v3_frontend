// GET /api/health — Liveness probe for Docker HEALTHCHECK
// Immediate response, no external dependencies
export async function GET() {
  return Response.json({ status: "ok" });
}