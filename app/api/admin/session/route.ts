import { hasAdminSession } from "../../../lib/auth";

export async function GET(request: Request) {
  return Response.json({ admin: await hasAdminSession(request) }, { headers: { "Cache-Control": "no-store" } });
}
