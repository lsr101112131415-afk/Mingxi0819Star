import { eq, inArray } from "drizzle-orm";
import { ensureDatabase } from "../../../../db/bootstrap";
import { getDb } from "../../../../db";
import { photos } from "../../../../db/schema";
import { hasAdminSession } from "../../../lib/auth";

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  const payload = (await request.json().catch(() => ({}))) as { locationId?: string; photoIds?: string[] };
  if (!payload.locationId || !payload.photoIds?.length) return Response.json({ error: "排序数据不完整" }, { status: 400 });
  await ensureDatabase();
  const db = getDb();
  const rows = await db.select({ id: photos.id, locationId: photos.locationId }).from(photos).where(inArray(photos.id, payload.photoIds));
  if (rows.length !== payload.photoIds.length || rows.some((row) => row.locationId !== payload.locationId)) {
    return Response.json({ error: "照片列表已变化，请刷新后重试" }, { status: 409 });
  }
  for (let index = 0; index < payload.photoIds.length; index += 1) {
    await db.update(photos).set({ sortOrder: index }).where(eq(photos.id, payload.photoIds[index]));
  }
  return Response.json({ ok: true });
}
