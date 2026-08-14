import { desc } from "drizzle-orm";
import { ensureDatabase } from "../../../../../db/bootstrap";
import { getDb } from "../../../../../db";
import { nextStopPhotos } from "../../../../../db/schema";
import { hasAdminSession } from "../../../../lib/auth";
import { photoBucket } from "../../../../lib/storage";

const MAX_BYTES = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  await ensureDatabase();
  const form = await request.formData();
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (!files.length) return Response.json({ error: "请选择照片" }, { status: 400 });
  for (const file of files) {
    if (!allowedTypes.has(file.type)) return Response.json({ error: `${file.name} 不是支持的图片格式` }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: `${file.name} 超过 10 MB` }, { status: 400 });
  }

  const db = getDb();
  const [last] = await db.select({ sortOrder: nextStopPhotos.sortOrder }).from(nextStopPhotos).orderBy(desc(nextStopPhotos.sortOrder)).limit(1);
  let sortOrder = (last?.sortOrder ?? -1) + 1;
  const created: string[] = [];
  for (const file of files) {
    const id = crypto.randomUUID();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const objectKey = `next-stop/${id}.${extension}`;
    await photoBucket().put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
    try {
      await db.insert(nextStopPhotos).values({
        id,
        objectKey,
        filename: file.name.slice(0, 200),
        mimeType: file.type,
        size: file.size,
        sortOrder,
        createdAt: Date.now(),
      });
      created.push(id);
      sortOrder += 1;
    } catch (error) {
      await photoBucket().delete(objectKey);
      throw error;
    }
  }
  return Response.json({ uploaded: created.length }, { status: 201 });
}
