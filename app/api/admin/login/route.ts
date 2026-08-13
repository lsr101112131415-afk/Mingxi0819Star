import { createSessionCookie, passwordMatches } from "../../../lib/auth";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { password?: string };
  if (!payload.password || !passwordMatches(payload.password)) {
    return Response.json({ error: "管理口令不正确" }, { status: 401 });
  }
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": await createSessionCookie(), "Cache-Control": "no-store" } },
  );
}
