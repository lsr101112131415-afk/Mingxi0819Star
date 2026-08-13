import { env } from "cloudflare:workers";

const initialLocations = [
  ["sydney", "悉尼", "Sydney · Australia", "故事从悉尼开始。海风、阳光，还有我们第一次一起出发的期待。", 1],
  ["vanuatu", "瓦努阿图", "Vanuatu", "在南太平洋的蓝色里，把快乐踩成一串小小的浪花。", 2],
  ["new-zealand", "新西兰", "New Zealand", "山、云和草地都很近，我们一起收集了好多绿色的记忆。", 3],
  ["japan", "日本", "Japan", "小街、列车和甜甜的点心，组成了闪闪发光的一站。", 4],
  ["thailand", "泰国", "Thailand", "热带的风吹过来，连笑声都变得暖暖的。", 5],
  ["hong-kong", "香港", "Hong Kong", "城市的灯亮起来，我们的星星旅程也多了一颗新收藏。", 6],
] as const;

let ready: Promise<void> | null = null;

export function ensureDatabase() {
  if (ready) return ready;
  const runtime = env as unknown as { DB?: D1Database };
  if (!runtime.DB) throw new Error("数据库暂时不可用");
  const db = runtime.DB;
  ready = (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        description TEXT NOT NULL,
        stop_order INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY NOT NULL,
        location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        object_key TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_photos_location_sort ON photos(location_id, sort_order)"),
    ]);
    await db.batch(
      initialLocations.map((row) =>
        db.prepare(
          "INSERT OR IGNORE INTO locations (id, name, subtitle, description, stop_order) VALUES (?, ?, ?, ?, ?)",
        ).bind(...row),
      ),
    );
    await db.prepare("PRAGMA optimize").run();
  })();
  return ready;
}
