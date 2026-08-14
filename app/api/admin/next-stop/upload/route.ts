import { getJourneyState, imageStore, saveJourneyState, storeImage, type StoredPhoto } from "../../../../lib/netlify-data";
import { hasAdminSession } from "../../../../lib/auth";

const MAX_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await hasAdminSession(request))) return Response.json({ error: "请先解锁管理模式" }, { status: 401 });
  const form = await request.formData();
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (!files.length) return Response.json({ error: "请选择照片" }, { status: 400 });
  for (const file of files) {
    if (!allowedTypes.has(file.type)) return Response.json({ error: `${file.name} 不是支持的图片格式` }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: `${file.name} 超过 5 MB` }, { status: 400 });
  }
  const state = await getJourneyState();
  let sortOrder = Math.max(-1, ...state.nextStopPhotos.map((photo) => photo.sortOrder)) + 1;
  const created: StoredPhoto[] = [];
  try {
    for (const file of files) {
      const id = crypto.randomUUID();
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const photo: StoredPhoto = { id, objectKey: `next-stop/${id}.${extension}`, filename: file.name.slice(0, 200), mimeType: file.type, size: file.size, sortOrder, createdAt: Date.now() };
      await storeImage(photo, file);
      created.push(photo);
      sortOrder += 1;
    }
    state.nextStopPhotos.push(...created);
    await saveJourneyState(state);
  } catch (error) {
    await Promise.all(created.map((photo) => imageStore().delete(photo.objectKey)));
    throw error;
  }
  return Response.json({ uploaded: created.length }, { status: 201 });
}
