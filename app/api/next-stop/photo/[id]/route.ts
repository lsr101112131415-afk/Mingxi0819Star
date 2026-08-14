import { eq } from "drizzle-orm";
import { ensureDatabase } from "../../../../../db/bootstrap";
import { getDb } from "../../../../../db";
import { nextStopPhotos } from "../../../../../db/schema";
import { photoBucket } from "../../../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const { id } = await context.params;
  const [photo] = await getDb().select().from(nextStopPhotos).where(eq(nextStopPhotos.id, id)).limit(1);
  if (!photo) return new Response("Not found", { status: 404 });
  const object = await photoBucket().get(photo.objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
}
