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

  return NextResponse.json({ error: "password 또는 emailVerified 필드가 필요해요" }, { status: 400 });
}
