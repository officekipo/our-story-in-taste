// public/sw.js
// 오프라인 fallback 전용 서비스 워커
// firebase-messaging-sw.js와 별개로 동작

const OFFLINE_URL   = "/offline";
const OFFLINE_CACHE = "offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
