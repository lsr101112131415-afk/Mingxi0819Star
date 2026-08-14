import { getJourneyState, imageStore, saveJourneyState } from "../../../../lib/netlify-data";
import { hasAdminSession } from "../../../../lib/auth";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  const { id } = await context.params;
  const state = await getJourneyState();
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return Response.json({ error: "照片不存在" }, { status: 404 });
  await imageStore().delete(photo.objectKey);
  state.photos = state.photos.filter((item) => item.id !== id);
  await saveJourneyState(state);
  return Response.json({ ok: true });
}
