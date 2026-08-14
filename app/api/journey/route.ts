import { asc } from "drizzle-orm";
import { ensureDatabase } from "../../../db/bootstrap";
import { getDb } from "../../../db";
import { locations, nextStopPhotos, photos } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    const db = getDb();
    const [locationRows, photoRows, nextStopPhotoRows] = await Promise.all([
      db.select().from(locations).orderBy(asc(locations.stopOrder)),
      db.select().from(photos).orderBy(asc(photos.locationId), asc(photos.sortOrder)),
      db.select().from(nextStopPhotos).orderBy(asc(nextStopPhotos.sortOrder)),
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
      nextStopPhotos: nextStopPhotoRows.map((photo) => ({
        id: photo.id,
        filename: photo.filename,
        url: `/api/next-stop/photo/${photo.id}`,
        sortOrder: photo.sortOrder,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "旅程暂时无法加载";
    return Response.json({ error: message }, { status: 500 });
  }
}
