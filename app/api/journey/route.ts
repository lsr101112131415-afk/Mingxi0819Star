import { asc } from "drizzle-orm";
import { ensureDatabase } from "../../../db/bootstrap";
import { getDb } from "../../../db";
import { locations, photos } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    const db = getDb();
    const [locationRows, photoRows] = await Promise.all([
      db.select().from(locations).orderBy(asc(locations.stopOrder)),
      db.select().from(photos).orderBy(asc(photos.locationId), asc(photos.sortOrder)),
    ]);
    return Response.json({
      locations: locationRows.map((location) => ({
        ...location,
        photos: photoRows
          .filter((photo) => photo.locationId === location.id)
          .map((photo) => ({
            id: photo.id,
            filename: photo.filename,
            url: `/api/photo/${photo.id}`,
            sortOrder: photo.sortOrder,
          })),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "旅程暂时无法加载";
    return Response.json({ error: message }, { status: 500 });
  }
}
