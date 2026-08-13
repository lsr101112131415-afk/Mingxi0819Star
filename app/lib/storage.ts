import { env } from "cloudflare:workers";

export function photoBucket() {
  const bucket = (env as unknown as { PHOTOS?: R2Bucket }).PHOTOS;
  if (!bucket) throw new Error("照片存储暂时不可用");
  return bucket;
}
