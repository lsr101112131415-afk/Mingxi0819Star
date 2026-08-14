import { getJourneyState, saveJourneyState } from "../../../lib/netlify-data";
import { hasAdminSession } from "../../../lib/auth";

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  const payload = (await request.json().catch(() => ({}))) as { locationId?: string; photoIds?: string[] };
  if (!payload.locationId || !payload.photoIds?.length) return Response.json({ error: "排序数据不完整" }, { status: 400 });
  const state = await getJourneyState();
  const selected = state.photos.filter((photo) => payload.photoIds?.includes(photo.id));
  if (selected.length !== payload.photoIds.length || selected.some((photo) => photo.locationId !== payload.locationId)) return Response.json({ error: "照片列表已变化，请刷新后重试" }, { status: 409 });
  payload.photoIds.forEach((id, index) => {
    const photo = state.photos.find((item) => item.id === id);
    if (photo) photo.sortOrder = index;
  });
  await saveJourneyState(state);
  return Response.json({ ok: true });
}
