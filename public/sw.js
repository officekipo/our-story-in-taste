// public/sw.js — 오프라인 fallback 전용

const OFFLINE_URL   = "/offline.html";  // ★ Next.js 페이지 아닌 순수 HTML
const OFFLINE_CACHE = "offline-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (res) => res ?? new Response("오프라인 상태입니다.", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      )
    )
  );
});
