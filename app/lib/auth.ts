import { env } from "cloudflare:workers";

const COOKIE_NAME = "star_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function runtimeEnv() {
  return env as unknown as { ADMIN_PASSWORD?: string; SESSION_SECRET?: string };
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sign(value: string) {
  const secret = runtimeEnv().SESSION_SECRET;
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

export async function createSessionCookie() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const value = String(expires);
  const token = `${value}.${await sign(value)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function hasAdminSession(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  const token = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(signature, await sign(expires));
}

export function passwordMatches(candidate: string) {
  const expected = runtimeEnv().ADMIN_PASSWORD ?? "";
  return Boolean(expected) && safeEqual(candidate, expected);
}
