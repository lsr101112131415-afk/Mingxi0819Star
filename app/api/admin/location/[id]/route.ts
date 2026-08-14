import { getJourneyState, initialLocations, saveJourneyState } from "../../../../lib/netlify-data";
import { hasAdminSession } from "../../../../lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  const payload = (await request.json().catch(() => ({}))) as { description?: string };
  const description = payload.description?.trim() ?? "";
  if (!description || description.length > 240) return Response.json({ error: "纪念文字需要在 1—240 字之间" }, { status: 400 });
  const { id } = await context.params;
  if (!initialLocations.some((location) => location.id === id)) return Response.json({ error: "地点不存在" }, { status: 404 });
  const state = await getJourneyState();
  state.descriptions[id] = description;
  await saveJourneyState(state);
  return Response.json({ ok: true });
}
