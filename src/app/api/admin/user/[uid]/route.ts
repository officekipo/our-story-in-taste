// ============================================================
//  src/app/api/admin/user/[uid]/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

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

// ★ 관리자용 커플 연동 강제 해제 (Admin SDK)
//   src/lib/firebase/auth.ts의 disconnectCouple()과 동일한 핵심 동작을
//   Admin SDK로 재구현 — 대상 유저가 본인이 아니어도 실행 가능해야 하므로
//   클라이언트 SDK(disconnectCouple)는 재사용할 수 없음
//   Cloud Functions onCoupleDisconnected가 couples 문서 삭제 시 트리거되어
//   visited/wishlist의 coupleId를 ""로 자동 초기화함 (Admin/클라이언트 무관하게 동작)
async function disconnectCoupleAdmin(uid: string, coupleId: string): Promise<void> {
  const db = getAdminDb();
  const coupleRef  = db.doc(`couples/${coupleId}`);
  const coupleSnap = await coupleRef.get();

  if (!coupleSnap.exists) {
    // couples 문서가 이미 없으면 users.coupleId만 정리
    await db.doc(`users/${uid}`).update({ coupleId: null }).catch(() => {});
    return;
  }

  const data       = coupleSnap.data() as { user1Uid: string; user2Uid: string | null };
  const partnerUid = data.user1Uid === uid ? data.user2Uid : data.user1Uid;

  const batch = db.batch();
  batch.update(db.doc(`users/${uid}`), { coupleId: null });
  if (partnerUid) {
    batch.update(db.doc(`users/${partnerUid}`), { coupleId: null });
  }
  await batch.commit();

  await coupleRef.delete().catch((e) => {
    console.error(`[disconnectCoupleAdmin] couples/${coupleId} 삭제 실패:`, e);
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = await params;

  try {
    const authUser = await getAdminAuth().getUser(uid);
    return NextResponse.json({
      email:          authUser.email                    ?? null,
      emailVerified:  authUser.emailVerified            ?? false,
      lastSignInTime: authUser.metadata.lastSignInTime  ?? null,
      creationTime:   authUser.metadata.creationTime    ?? null,
    });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = await params;
  const body = await req.json().catch(() => ({}));

  // ★ 커플 연동 강제 해제
  if ("disconnectCouple" in body && body.disconnectCouple) {
    try {
      const userSnap = await getAdminDb().doc(`users/${uid}`).get();
      if (!userSnap.exists) {
        return NextResponse.json({ error: "존재하지 않는 유저입니다" }, { status: 404 });
      }
      const coupleId = userSnap.data()?.coupleId as string | null | undefined;
      if (!coupleId) {
        return NextResponse.json({ error: "이 유저는 커플 연동 상태가 아니에요" }, { status: 400 });
      }
      await disconnectCoupleAdmin(uid, coupleId);
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("admin disconnectCouple error:", err);
      return NextResponse.json({ error: "커플 연동 해제 실패" }, { status: 500 });
    }
  }

  // 이메일 인증 강제 처리
  if ("emailVerified" in body) {
    try {
      await getAdminAuth().updateUser(uid, { emailVerified: true });
      return NextResponse.json({ ok: true, emailVerified: true });
    } catch (err) {
      console.error("emailVerified update error:", err);
      return NextResponse.json({ error: "인증 처리 실패" }, { status: 500 });
    }
  }

  // 비밀번호 변경
  if ("password" in body) {
    if (!body.password || String(body.password).length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 해요" }, { status: 400 });
    }
    try {
      await getAdminAuth().updateUser(uid, { password: String(body.password) });
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("password change error:", err);
      return NextResponse.json({ error: "변경 실패" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "password, emailVerified, disconnectCouple 필드가 필요해요" }, { status: 400 });
}

// ★ 관리자용 계정 강제 탈퇴
//   src/app/settings/page.tsx의 handleWithdraw()와 동일한 삭제 범위를 유지:
//   1) 커플 연동 해제  2) visited(authorUid) 삭제  3) wishlist(addedByUid) 삭제
//   4) users 문서 삭제  5) Firebase Auth 계정 삭제
//   ※ 자기 자신을 삭제하는 게 아니므로 클라이언트 SDK(deleteUser)는 사용 불가 → Admin SDK 전용
//   ※ 원본 handleWithdraw와 마찬가지로 프로필/기록 이미지의 Storage 파일은 별도 정리하지 않음
//     (기존 자체 탈퇴 로직과 동일한 범위로 맞춤 — 필요 시 추후 별도 보완)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = await params;
  const db = getAdminDb();

  try {
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "존재하지 않는 유저입니다" }, { status: 404 });
    }
    const userData = userSnap.data() as { coupleId?: string | null; role?: string };

    // ★ 안전장치: 관리자 계정은 강제 탈퇴 대상에서 제외 (오조작 방지)
    if (userData.role === "admin") {
      return NextResponse.json({ error: "관리자 계정은 강제 탈퇴할 수 없어요. 먼저 역할을 해제해주세요." }, { status: 400 });
    }

    // 1) 커플 연동 해제
    if (userData.coupleId) {
      await disconnectCoupleAdmin(uid, userData.coupleId);
    }

    // 2) visited 기록 삭제 (authorUid 기준)
    const visitedSnap = await db.collection("visited").where("authorUid", "==", uid).get();
    await Promise.all(visitedSnap.docs.map(d => d.ref.delete()));

    // 3) wishlist 기록 삭제 (addedByUid 기준)
    const wishSnap = await db.collection("wishlist").where("addedByUid", "==", uid).get();
    await Promise.all(wishSnap.docs.map(d => d.ref.delete()));

    // 4) users 문서 삭제
    await db.doc(`users/${uid}`).delete();

    // 5) Firebase Auth 계정 삭제
    try {
      await getAdminAuth().deleteUser(uid);
    } catch (err) {
      // Auth 계정이 이미 없는 경우 등은 무시 (Firestore 정리는 이미 완료됨)
      console.error(`[DELETE user] Auth 계정 삭제 실패 (uid=${uid}):`, err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("force withdraw error:", err);
    return NextResponse.json({ error: "강제 탈퇴 처리 중 오류가 발생했어요" }, { status: 500 });
  }
}
