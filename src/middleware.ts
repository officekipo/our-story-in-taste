// src/middleware.ts
// 접속 흐름 제어:
//   첫 접속      → /onboarding
//   온보딩 완료  → /login (로그인 안 된 상태)
//   로그인 완료  → / (메인)
//
// ※ localStorage는 서버에서 읽을 수 없으므로
//   온보딩 완료 여부는 쿠키(onboarding_done)로 판단

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/onboarding", "/login", "/signup", "/couple"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, API, Next 내부 경로는 통과
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|svg|webp|json|txt)$/)
  ) {
    return NextResponse.next();
  }

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 온보딩 완료 쿠키 확인
  const onboardingDone = request.cookies.get("onboarding_done")?.value;
  if (!onboardingDone && pathname !== "/onboarding") {
    // 첫 접속 → 온보딩으로
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Firebase Auth 세션 확인 (실제 구현은 Step06 이후)
  // 지금은 클라이언트 측에서 authStore.initialized 로 처리
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
