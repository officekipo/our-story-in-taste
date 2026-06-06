// public/sw.js — 오프라인 fallback 전용

const OFFLINE_URL   = "/offline";
const OFFLINE_CACHE = "offline-v1";

// ★ install: /offline 캐시 + 즉시 활성화
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())  // ★ waitUntil 안에서 호출
  );
});

// ★ activate: 즉시 모든 탭 제어권 획득
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // ★ 기존 탭도 즉시 제어
  );
});

// ★ fetch: navigate 요청 실패 시 /offline 반환
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
