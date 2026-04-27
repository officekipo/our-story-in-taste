// ============================================================
//  firebase-messaging-sw.js  적용 경로: public/firebase-messaging-sw.js
//
//  Fix:
//    ★ onBackgroundMessage — payload.data에서 title/body 읽도록 변경
//      이유: Cloud Functions가 data-only 방식으로 변경되어
//            payload.notification이 undefined가 됨
//            백그라운드 알림은 SW가 data에서 읽어 직접 표시
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyCHM-xI01YRM0xrbGfXJ6wzTb1p6uggSJA",
  authDomain:        "our-taste-36646.firebaseapp.com",
  projectId:         "our-taste-36646",
  storageBucket:     "our-taste-36646.appspot.com",
  messagingSenderId: "458084666631",
  appId:             "1:458084666631:web:c778ce47e58a70523209a2",
});

const messaging = firebase.messaging();

// ── 백그라운드 푸시 수신 핸들러 ──────────────────────────
// ★ data-only 방식으로 변경: payload.data에서 title/body 읽기
//   (payload.notification은 data-only 메시지에서 undefined)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] 백그라운드 메시지 수신:", payload);

  // ★ data 필드에서 title/body 읽기 (notification 필드 폴백 유지)
  const title = payload.data?.title
    ?? payload.notification?.title
    ?? "우리의 맛지도";

  const body  = payload.data?.body
    ?? payload.notification?.body
    ?? "새로운 알림이 있어요 🍽️";

  const icon  = payload.data?.icon
    ?? payload.notification?.icon
    ?? "/icon-192.png";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/icon-72.png",
    data:  payload.data,    // notificationclick에서 url 등 접근용
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
