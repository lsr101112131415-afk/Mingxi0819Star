import { getJourneyState, imageStore } from "../../../lib/netlify-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const state = await getJourneyState();
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return new Response("Not found", { status: 404 });
  const object = await imageStore().get(photo.objectKey, { type: "arrayBuffer" });
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object, { headers: { "Content-Type": photo.mimeType, "Cache-Control": "public, max-age=31536000, immutable" } });
}
