import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the birthday invitation and journey", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>严明曦的五岁星星旅程<\/title>/);
  assert.match(html, /严明曦/);
  assert.match(html, /8月19日/);
  assert.match(html, /寿司宋/);
  assert.match(html, /每天开心一点点/);
  for (const place of ["悉尼", "瓦努阿图", "新西兰", "日本", "泰国", "香港"]) assert.match(html, new RegExp(place));
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("includes durable album bindings and reduced-motion support", async () => {
  const [hosting, css, page] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/JourneyExperience.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "PHOTOS"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /map-canvas\.is-zoomed/);
  assert.match(page, /image\/jpeg,image\/png,image\/webp/);
  assert.match(page, /10 MB/);
});
