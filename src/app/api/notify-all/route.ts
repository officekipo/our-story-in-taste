// ============================================================
//  src/app/api/notify-all/route.ts
//  관리자 전용 — 전체 유저 FCM 브로드캐스트
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminMessaging } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return false;
  try {
    const decoded  = await getAdminAuth().verifyIdToken(header.slice(7));
    const userSnap = await getAdminDb().doc(`users/${decoded.uid}`).get();
    return userSnap.data()?.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body } = await req.json().catch(() => ({}));
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title, body 필드가 필요해요" }, { status: 400 });
  }

  const usersSnap = await getAdminDb().collection("users").get();
  const tokens = usersSnap.docs
    .map((d) => d.data().fcmToken as string | undefined)
    .filter((t): t is string => !!t);

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "등록된 FCM 토큰 없음" });
  }

  const CHUNK = 500;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const chunk = tokens.slice(i, i + CHUNK);
    const res = await getAdminMessaging().sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      webpush: {
        notification: { title, body, icon: "/icon-192.png", badge: "/icon-72.png" },
        fcmOptions: { link: "/" },
      },
    });
    sent   += res.successCount;
    failed += res.failureCount;
  }

  return NextResponse.json({ ok: true, sent, failed });
}
