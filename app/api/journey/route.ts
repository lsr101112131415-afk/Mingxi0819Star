import { getJourneyState, initialLocations } from "../../lib/netlify-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getJourneyState();
    return Response.json({
      locations: initialLocations.map((location) => ({
        ...location,
        description: state.descriptions[location.id] ?? location.description,
        photos: state.photos
          .filter((photo) => photo.locationId === location.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((photo) => ({ id: photo.id, filename: photo.filename, url: `/api/photo/${photo.id}`, sortOrder: photo.sortOrder })),
      })),
      nextStopPhotos: [...state.nextStopPhotos]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({ id: photo.id, filename: photo.filename, url: `/api/next-stop/photo/${photo.id}`, sortOrder: photo.sortOrder })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "旅程暂时无法加载";
    return Response.json({ error: message }, { status: 500 });
  }
}
