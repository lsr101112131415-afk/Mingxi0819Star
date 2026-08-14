import { getStore } from "@netlify/blobs";

export type StoredPhoto = {
  id: string;
  locationId?: string;
  objectKey: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  createdAt: number;
};

export type JourneyState = {
  descriptions: Record<string, string>;
  photos: StoredPhoto[];
  nextStopPhotos: StoredPhoto[];
};

export const initialLocations = [
  { id: "sydney", name: "悉尼", subtitle: "Sydney · Australia", description: "故事从悉尼开始。海风、阳光，还有我们第一次一起出发的期待。", stopOrder: 1 },
  { id: "vanuatu", name: "瓦努阿图", subtitle: "Vanuatu", description: "在南太平洋的蓝色里，把快乐串成一串小小的浪花。", stopOrder: 2 },
  { id: "new-zealand", name: "新西兰", subtitle: "New Zealand", description: "山、云和草地都很近，我们一起收集了好多绿色的记忆。", stopOrder: 3 },
  { id: "japan", name: "日本", subtitle: "Japan", description: "小街、列车和甜甜的点心，组成了闪闪发光的一站。", stopOrder: 4 },
  { id: "thailand", name: "泰国", subtitle: "Thailand", description: "热带的风吹过来，连笑声都变得暖暖的。", stopOrder: 5 },
  { id: "hong-kong", name: "香港", subtitle: "Hong Kong", description: "城市的灯亮起来，我们的星星旅程也多了一颗新收藏。", stopOrder: 6 },
] as const;

const dataStore = () => getStore({ name: "mingxi-journey-data", consistency: "strong" });
export const imageStore = () => getStore({ name: "mingxi-journey-images", consistency: "strong" });

export async function getJourneyState(): Promise<JourneyState> {
  const stored = await dataStore().get("state", { type: "json" }) as JourneyState | null;
  return {
    descriptions: stored?.descriptions ?? {},
    photos: Array.isArray(stored?.photos) ? stored.photos : [],
    nextStopPhotos: Array.isArray(stored?.nextStopPhotos) ? stored.nextStopPhotos : [],
  };
}

export async function saveJourneyState(state: JourneyState) {
  await dataStore().setJSON("state", state);
}

export async function storeImage(photo: StoredPhoto, file: File) {
  await imageStore().set(photo.objectKey, await file.arrayBuffer(), {
    metadata: { contentType: photo.mimeType, filename: photo.filename },
  });
}
