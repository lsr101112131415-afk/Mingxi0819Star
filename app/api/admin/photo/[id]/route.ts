import { eq } from "drizzle-orm";
import { ensureDatabase } from "../../../../../db/bootstrap";
import { getDb } from "../../../../../db";
import { photos } from "../../../../../db/schema";
import { hasAdminSession } from "../../../../lib/auth";
import { photoBucket } from "../../../../lib/storage";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  await ensureDatabase();
  const { id } = await context.params;
  const db = getDb();
  const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
  if (!photo) return Response.json({ error: "照片不存在" }, { status: 404 });
  await photoBucket().delete(photo.objectKey);
  await db.delete(photos).where(eq(photos.id, id));
  return Response.json({ ok: true });
}
