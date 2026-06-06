// ============================================================
//  firebase-messaging-sw.js  적용 경로: public/firebase-messaging-sw.js
//  FCM 전용 — 오프라인 처리는 sw.js에서 담당
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyCHM-xI01YRM0xrbGfXJ6wzTb1p6uggSJA",
  authDomain:        "our-story-in-taste-mauve.vercel.app",
  projectId:         "our-taste-36646",
  storageBucket:     "our-taste-36646.appspot.com",
  messagingSenderId: "458084666631",
  appId:             "1:458084666631:web:c778ce47e58a70523209a2",
});

const messaging = firebase.messaging();

// ── 백그라운드 푸시 수신 핸들러 ──────────────────────────
messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title
    ?? payload.notification?.title
    ?? "우리의 맛지도";

  const body = payload.data?.body
    ?? payload.notification?.body
    ?? "새로운 알림이 있어요 🍽️";

  const icon = payload.data?.icon
    ?? payload.notification?.icon
    ?? "/icon-192.png";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/icon-72.png",
    data:  payload.data,
  });
});

// ── 알림 클릭 시 앱으로 이동 ────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
