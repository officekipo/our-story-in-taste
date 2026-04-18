// ============================================================
//  firebase-messaging-sw.js  적용 경로: public/firebase-messaging-sw.js
//
//  Firebase Cloud Messaging 서비스 워커
//
//  ⚠️  아래 firebaseConfig 값을 실제 Firebase 프로젝트 키로 교체하세요.
//      Firebase Console → 프로젝트 설정 → 일반 → 웹 앱 → SDK 구성
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",               // ← 실제 값으로 교체
  authDomain:        "our-taste-36646.firebaseapp.com",
  projectId:         "our-taste-36646",
  storageBucket:     "our-taste-36646.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",   // ← 실제 값으로 교체
  appId:             "YOUR_APP_ID",                // ← 실제 값으로 교체
});

const messaging = firebase.messaging();

// ── 백그라운드 푸시 수신 핸들러 ──────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] 백그라운드 메시지 수신:", payload);

  const { title, body, icon } = payload.notification ?? {};

  self.registration.showNotification(title ?? "우리의 맛지도", {
    body:  body  ?? "새로운 알림이 있어요 🍽️",
    icon:  icon  ?? "/icon-192.png",
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
