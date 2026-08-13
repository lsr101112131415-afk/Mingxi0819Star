import { eq } from "drizzle-orm";
import { ensureDatabase } from "../../../../../db/bootstrap";
import { getDb } from "../../../../../db";
import { locations } from "../../../../../db/schema";
import { hasAdminSession } from "../../../../lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  const payload = (await request.json().catch(() => ({}))) as { description?: string };
  const description = payload.description?.trim() ?? "";
  if (!description || description.length > 240) return Response.json({ error: "纪念文字需要在 1–240 字之间" }, { status: 400 });
  await ensureDatabase();
  const { id } = await context.params;
  await getDb().update(locations).set({ description }).where(eq(locations.id, id));
  return Response.json({ ok: true });
}
